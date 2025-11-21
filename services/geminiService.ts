import { GoogleGenAI } from "@google/genai";

// Initialize the client with the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash-image';

/**
 * Edits an image based on a text prompt using Gemini 2.5 Flash Image.
 * Supports an optional reference image for style transfer or specific object insertion.
 * 
 * @param base64Image - The base64 encoded string of the source image.
 * @param mimeType - The MIME type of the source image.
 * @param prompt - The text instruction for editing.
 * @param referenceImageBase64 - (Optional) Base64 string of a reference image.
 * @param referenceMimeType - (Optional) MIME type of the reference image.
 * @returns Promise resolving to the base64 data URL of the generated image.
 */
export const editImageWithGemini = async (
  base64Image: string,
  mimeType: string,
  prompt: string,
  referenceImageBase64?: string | null,
  referenceMimeType?: string | null
): Promise<string> => {
  try {
    const parts: any[] = [];

    // 1. Add the main source image
    parts.push({
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    });

    // 2. Add the reference image if provided
    if (referenceImageBase64 && referenceMimeType) {
      parts.push({
        inlineData: {
          data: referenceImageBase64,
          mimeType: referenceMimeType,
        },
      });
    }

    // 3. Add the text prompt
    // Adding text last often helps the model understand it's an instruction applied to the images
    parts.push({
      text: prompt,
    });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts,
      },
      config: {
        // Optional: safety settings could be added here
      }
    });

    // Iterate through parts to find the image part
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }

    // Fallback for text-only error responses
    const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
    if (textPart && textPart.text) {
      throw new Error(`Gemini refused to generate an image. Reason: ${textPart.text}`);
    }

    throw new Error("No image data received from Gemini.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to edit image using Gemini.");
  }
};
