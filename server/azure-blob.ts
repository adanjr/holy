import { BlobServiceClient } from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const containerName = process.env.AZURE_CONTAINER!;

export async function uploadToAzure(filePath: string, fileName: string) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

  console.log("Container name:", containerName);

  const containerClient = blobServiceClient.getContainerClient(containerName);

  console.log("ContainerClient exists:", !!containerClient);

  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  

  await blockBlobClient.uploadFile(filePath);

  return blockBlobClient.url;
}