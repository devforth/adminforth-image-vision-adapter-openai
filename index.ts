import type { AdapterOptions } from "./types.js";
import type { ImageVisionAdapter } from "adminforth";


export default class ImageVisionAdapterOpenAI implements ImageVisionAdapter {
  options: AdapterOptions;

  constructor(options: AdapterOptions) {
    this.options = options;
    this.options.model = options.model || 'gpt-4.1-mini';
  }

  validate() {
    if (!this.options.openAiApiKey) {
      throw new Error("API Key is required");
    }
  }

  
  inputFileExtensionSupported(): string[] {
    return ['png', 'jpeg', 'jpg', 'webp', 'gif'];
  }

  async generate(params: {
    prompt: string,
    inputFileUrls: string[],
  }): Promise<{
    response: string;
    error?: string;
  }> {    


    return await this.scanImage({ prompt: params.prompt, inputFileUrls: params.inputFileUrls });
  }
  
  private async scanImage({
    prompt,
    inputFileUrls,
  }: {
    prompt: string,
    inputFileUrls: string[],
  }): Promise<{
    response: string;
    error?: string;
  }> {

    const headers = {
      Authorization: `Bearer ${this.options.openAiApiKey}`,
      'Content-Type': 'application/json',
    };


    
    const content = [
      { type: "input_text", text: `${prompt}` },
      ...inputFileUrls.map(url => ({
        type: "input_image",
        image_url: url,
      })),
    ];

    process.env.HEAVY_DEBUG && console.log("Request body:", JSON.stringify({
        model: this.options.model,
        input: [
          {
            role: "user",
            content: content,
          }
        ]
      }));
    
    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        model: this.options.model,
        input: [
          {
            role: "user",
            content: content,
          }
        ]
      })
    });
    const data = await resp.json();
    process.env.HEAVY_DEBUG && console.log("Response:", data);

    return {
      response: data.output[0].content[0].text,
      error: data.error
    };
  }
}