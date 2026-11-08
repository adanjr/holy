import {
  makeCancelSignal,
  renderMedia,
  selectComposition,
} from "@remotion/renderer";
import { randomUUID } from "node:crypto";
import path from "node:path";
//import { uploadToS3 } from "./s3";
import { uploadToAzure } from "./azure-blob";
import fs from "node:fs/promises";

interface JobData {
  inputProps: {
    scenes: any[];
    voiceUrl?: string | null;
  };
  videoConfig: {
    fps: number;
    width: number;
    height: number;
    durationInFrames: number;
  };
}


type JobState =
  | {
      status: "queued";
      data: JobData;
      cancel: () => void;
    }
  | {
      status: "in-progress";
      progress: number;
      data: JobData;
      cancel: () => void;
    }
  | {
      status: "completed";
      videoUrl: string;
      data: JobData;
    }
  | {
      status: "failed";
      error: string;
      data: JobData;
    };

const compositionId = "Video";
const MAX_RENDER_MS = Number(process.env.RENDER_MAX_MS || 6 * 60 * 60 * 1000);
const STALLED_RENDER_MS = Number(process.env.RENDER_STALL_MS || 15 * 60 * 1000);

const getRenderEnvVariables = () => {
  const envVariables: Record<string, string> = {};

  if (process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    envVariables.NEXT_PUBLIC_MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  }

  if (process.env.NEXT_PUBLIC_STADIA_MAPS_API_KEY) {
    envVariables.NEXT_PUBLIC_STADIA_MAPS_API_KEY =
      process.env.NEXT_PUBLIC_STADIA_MAPS_API_KEY;
  }

  return envVariables;
};

export const makeRenderQueue = ({
  port,
  serveUrl,
  rendersDir,
}: {
  port: number;
  serveUrl: string;
  rendersDir: string;
}) => {
  const jobs = new Map<string, JobState>();
  let queue: Promise<unknown> = Promise.resolve();

  const processRender = async (jobId: string) => {
    const job = jobs.get(jobId);
    if (!job) {
      throw new Error(`Render job ${jobId} not found`);
    }

    const { cancel, cancelSignal } = makeCancelSignal();

    jobs.set(jobId, {
      progress: 0,
      status: "in-progress",
      cancel: cancel,
      data: job.data,
    });

    let lastProgressAt = Date.now();
    const totalTimeout = setTimeout(() => cancel(), MAX_RENDER_MS);
    const stallWatchdog = setInterval(() => {
      if (Date.now() - lastProgressAt > STALLED_RENDER_MS) cancel();
    }, 30_000);

    try {
      const { inputProps } = job.data;

      const videoConfig = job.data.videoConfig ?? {
        fps: 30,
        width: 1280,
        height: 720,
        durationInFrames: 300, // fallback seguro
      };

      const envVariables = getRenderEnvVariables();

      const composition = await selectComposition({
        serveUrl,
        id: compositionId,
        inputProps,
        envVariables,
      });

      composition.durationInFrames = videoConfig.durationInFrames;
      composition.fps = videoConfig.fps;
      composition.width = videoConfig.width;
      composition.height = videoConfig.height;

      const outputPath = path.join(rendersDir, `${jobId}.mp4`);

      await renderMedia({
        cancelSignal,
        serveUrl,
        browserExecutable: null,
        composition,
        inputProps,
        envVariables,
        codec: "h264",       

        onProgress: (progress) => {
          lastProgressAt = Date.now();
          console.info(`${jobId} render progress:`, progress.progress);
          jobs.set(jobId, {
            progress: progress.progress,
            status: "in-progress",
            cancel: cancel,
            data: job.data,
          });
        },
        outputLocation: outputPath,
      });

      //const s3Key = `renders/${jobId}.mp4`;

      //const publicUrl = await uploadToS3({
      //  filePath: outputPath,
      //  key: s3Key,
      //});
      const fileName = `${jobId}.mp4`;

      const publicUrl = await uploadToAzure(
        outputPath,
        fileName
      );

      await fs.unlink(outputPath);

      jobs.set(jobId, {
        status: "completed",
        videoUrl: publicUrl,
        data: job.data,
      });
    } catch (error) {
      console.error(error);
      jobs.set(jobId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Render failed unexpectedly",
        data: job.data,
      });
    } finally {
      clearTimeout(totalTimeout);
      clearInterval(stallWatchdog);
    }
  };

  const queueRender = async ({
    jobId,
    data,
  }: {
    jobId: string;
    data: JobData;
  }) => {
    jobs.set(jobId, {
      status: "queued",
      data,
      cancel: () => {
        jobs.delete(jobId);
      },
    });

    queue = queue
      .catch((error) => console.error("Previous render queue task failed", error))
      .then(() => processRender(jobId));
  };

  function createJob(data: JobData) {
    const jobId = randomUUID();

    queueRender({ jobId, data });

    return jobId;
  }

  return {
    createJob,
    jobs,
  };
};
