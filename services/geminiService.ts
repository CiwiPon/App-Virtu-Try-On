import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  // This is a fallback for development. In a real environment, the key should be set.
  console.warn("API_KEY environment variable not set. Using a placeholder.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "" });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

export const generateTryOnImage = async (
  modelImage: { base64: string; mimeType: string },
  productImage: { base64: string; mimeType: string },
  userPrompt: string
): Promise<string[]> => {
    if (!API_KEY) {
        throw new Error("API key is not configured. Please set the API_KEY environment variable.");
    }
  const model = "gemini-2.5-flash-image";

  const modelImagePart = fileToGenerativePart(modelImage.base64, modelImage.mimeType);
  const productImagePart = fileToGenerativePart(productImage.base64, productImage.mimeType);
  
  const basePrompt = "Take the clothing item from the second image and realistically place it on the person in the first image. Ensure the person's pose, the background, and the lighting are preserved. The final output should be a photorealistic image of the person wearing the new outfit.";
  const finalPrompt = userPrompt ? `${basePrompt} The user also requested: "${userPrompt}".` : basePrompt;

  const poses = [
    " The person should be standing still, facing forward, full body shot.",
    " The person should be in a dynamic walking pose, captured from the side.",
    " The person should be posing with a hand on their hip, looking at the camera.",
    " The person should be captured from a three-quarter angle view, smiling subtly.",
  ];

  try {
    const generationPromises = poses.map(pose => {
        const textPart = { text: `${finalPrompt}${pose}` };
        return ai.models.generateContent({
            model: model,
            contents: {
                parts: [modelImagePart, productImagePart, textPart],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
    });

    const responses = await Promise.all(generationPromises);

    const imageResults = responses.map(response => {
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                return part.inlineData.data;
            }
        }
        return null;
    }).filter((d): d is string => d !== null);

    if (imageResults.length < 4) {
        throw new Error(`Failed to generate all 4 images. Only got ${imageResults.length}. Please try again.`);
    }

    return imageResults;

  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    throw new Error("Failed to generate the virtual try-on images. Please try again.");
  }
};