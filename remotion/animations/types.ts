export interface ThemeConfig {
  primaryColor: string
  secondaryColor?: string
  backgroundColor?: string
  textColor?: string
  textSecondary?: string
  fontFamily?: string
  gridColor?: string
  axisColor?: string
  palette?: string[]
}

export interface AnimationConfig {
  durationInFrames: number
  delay?: number
  easing?: "spring" | "linear"
}

export interface SceneJSON<TData = unknown> {
  type: string
  data: TData
  theme: ThemeConfig | string
  animation: AnimationConfig
}