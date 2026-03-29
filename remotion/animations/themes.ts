export interface ThemeConfig {
  primaryColor: string
  secondaryColor?: string
  backgroundColor?: string
  fontFamily?: string
}

export interface AnimationConfig {
  durationInFrames: number
  delay?: number
  easing?: "spring" | "linear"
}

export interface SceneJSON {
  type: string
  data: any
  theme: ThemeConfig | string
  animation: AnimationConfig
}