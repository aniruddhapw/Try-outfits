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
    
    // Extract error details (handle both direct and nested error structures)
    const errorObj = error.error || error;
    const errorCode = errorObj.code || error.code;
    const errorStatus = errorObj.status || error.status;
    const errorMessage = errorObj.message || error.message || '';
    const errorDetails = errorObj.details || error.details || [];
    
    // Handle quota/rate limit errors specifically
    if (errorCode === 429 || errorStatus === 'RESOURCE_EXHAUSTED' || errorMessage.includes('quota') || errorMessage.includes('Quota exceeded')) {
      const errorMessage = error.message || '';
      let retryAfter = null;
      
      // Try to extract retry delay from error details
      if (errorDetails && errorDetails.length > 0) {
        for (const detail of errorDetails) {
          if (detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo' && detail.retryDelay) {
            retryAfter = detail.retryDelay;
            break;
          }
        }
      }
      
      // Parse retry delay if it's in seconds format like "52s" or "52.88s"
      if (retryAfter) {
        const seconds = parseFloat(retryAfter.replace('s', ''));
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.ceil(seconds % 60);
        
        if (minutes > 0) {
          throw new Error(
            `API quota exceeded. You've reached the free tier limit. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} ${remainingSeconds > 0 ? `and ${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}` : ''} before trying again, or upgrade your plan at https://ai.google.dev/pricing`
          );
        } else {
          throw new Error(
            `API quota exceeded. Please wait ${Math.ceil(seconds)} second${Math.ceil(seconds) > 1 ? 's' : ''} before trying again, or upgrade your plan at https://ai.google.dev/pricing`
          );
        }
      }
      
      throw new Error(
        `API quota exceeded. You've reached the free tier limit. Please wait a few minutes before trying again, or upgrade your plan at https://ai.google.dev/pricing`
      );
    }
    
    // Handle other API errors
    if (errorMessage && errorMessage.includes('quota')) {
      throw new Error(
        `API quota exceeded. You've reached the free tier limit. Please wait a few minutes before trying again, or upgrade your plan at https://ai.google.dev/pricing`
      );
    }
    
    throw new Error(errorMessage || "Failed to edit image using Gemini.");
  }
};
