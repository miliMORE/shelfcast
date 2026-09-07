export interface TtsSynthesizeInput {
  text: string;
  voice?: string;
  /** Hint for mock provider length */
  chunkIndex?: number;
}

export interface TtsSynthesizeResult {
  /** Raw audio bytes (WAV for mock, MP3 for OpenAI) */
  audio: Buffer;
  mimeType: string;
  extension: string;
}

export interface TtsProvider {
  readonly name: string;
  synthesize(input: TtsSynthesizeInput): Promise<TtsSynthesizeResult>;
}
