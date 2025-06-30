/**
 * OpenRouter client for AI-based text analysis
 * Uses DeepSeek R1 model for advanced text processing
 */

// Default model to use
const DEFAULT_MODEL = 'deepseek-ai/deepseek-v2';

/**
 * Call the OpenRouter API with the DeepSeek R1 model
 * @param prompt The prompt to send to the model
 * @param options Additional options for the API call
 * @returns The AI response text
 */
export async function callOpenRouter(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  } = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set in environment variables');
  }
  
  const {
    model = DEFAULT_MODEL,
    temperature = 0.2,
    maxTokens = 500,
    systemPrompt = "You are a helpful assistant that specializes in analyzing text data."
  } = options;
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://concerts.app', // Replace with your actual domain
        'X-Title': 'Concert Aggregator App'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: temperature,
        max_tokens: maxTokens,
        stream: false
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${response.status} ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    throw error;
  }
}

/**
 * Check if a venue name is similar to existing venues in the database
 * @param venueName The venue name to check
 * @param existingVenues Array of existing venue names
 * @returns Object with normalized name and whether it's a duplicate
 */
export async function checkVenueSimilarity(
  venueName: string,
  existingVenues: string[]
): Promise<{ normalizedName: string; isDuplicate: boolean; duplicateOf?: string; confidence?: number }> {
  if (!venueName || existingVenues.length === 0) {
    return { normalizedName: venueName, isDuplicate: false };
  }
  
  try {
    const systemPrompt = `
      You are an expert system that specializes in identifying venue name variations and duplicates.
      Your task is to normalize venue names and detect if a new venue name is a variation or duplicate of existing venues.
      Consider things like:
      1. Different spellings or formats (e.g., "The Venue" vs "The Venue Bar")
      2. Inclusion/exclusion of location identifiers (e.g., "The Venue - Atlanta" vs "The Venue")
      3. Abbreviations (e.g., "The Venue" vs "TV")
      4. Common prefixes/suffixes like "The", "Bar", "Club", "Lounge", etc.
      
      Always return a JSON object with these fields:
      - normalizedName: The standardized version of the input venue name
      - isDuplicate: true if the venue is likely a duplicate of an existing venue
      - duplicateOf: The name of the existing venue it's a duplicate of (if isDuplicate is true)
      - confidence: A number between 0-1 indicating your confidence in the duplicate detection
    `;
    
    const prompt = `
      New venue name: "${venueName}"
      
      Existing venues:
      ${existingVenues.map(v => `- "${v}"`).join('\n')}
      
      Analyze if the new venue name is a duplicate or variation of any existing venue.
      Return your analysis as a JSON object.
    `;
    
    const response = await callOpenRouter(prompt, { 
      systemPrompt,
      temperature: 0.1 // Lower temperature for more deterministic results
    });
    
    // Parse the response as JSON
    try {
      const result = JSON.parse(response);
      return {
        normalizedName: result.normalizedName || venueName,
        isDuplicate: result.isDuplicate || false,
        duplicateOf: result.duplicateOf,
        confidence: result.confidence
      };
    } catch (parseError) {
      console.error('Error parsing OpenRouter response:', parseError);
      // Fall back to returning the original name
      return { normalizedName: venueName, isDuplicate: false };
    }
  } catch (error) {
    console.error('Error checking venue similarity:', error);
    // Fall back to returning the original name
    return { normalizedName: venueName, isDuplicate: false };
  }
}

/**
 * Clean and normalize artist names by removing venue names and other noise
 * @param artistName The artist name to clean
 * @param venueNames Optional array of venue names to check for and remove
 * @returns The cleaned artist name
 */
export async function cleanArtistName(
  artistName: string,
  venueNames: string[] = []
): Promise<{ originalName: string; cleanedName: string; possibleVenue?: string }> {
  if (!artistName) {
    return { originalName: artistName, cleanedName: artistName };
  }
  
  try {
    const systemPrompt = `
      You are an expert system that specializes in cleaning and normalizing artist names.
      Your task is to:
      1. Remove any venue names that might be included in the artist name
      2. Remove common prefixes like "Live at", "Performing at", etc.
      3. Remove date/time information
      4. Standardize formatting (proper capitalization, remove unnecessary punctuation)
      5. Identify if the input might actually be a venue name rather than an artist
      
      Always return a JSON object with these fields:
      - cleanedName: The cleaned and normalized artist name
      - possibleVenue: If the input appears to be a venue rather than an artist, include the venue name here
    `;
    
    let prompt = `
      Artist name to clean: "${artistName}"
    `;
    
    // Add venue names to the prompt if available
    if (venueNames.length > 0) {
      prompt += `\nKnown venue names that might appear in artist names:\n${venueNames.map(v => `- "${v}"`).join('\n')}`;
    }
    
    prompt += `\n\nReturn your cleaned artist name as a JSON object.`;
    
    const response = await callOpenRouter(prompt, { 
      systemPrompt,
      temperature: 0.1 // Lower temperature for more deterministic results
    });
    
    // Parse the response as JSON
    try {
      const result = JSON.parse(response);
      return {
        originalName: artistName,
        cleanedName: result.cleanedName || artistName,
        possibleVenue: result.possibleVenue
      };
    } catch (parseError) {
      console.error('Error parsing OpenRouter response:', parseError);
      // Fall back to returning the original name
      return { originalName: artistName, cleanedName: artistName };
    }
  } catch (error) {
    console.error('Error cleaning artist name:', error);
    // Fall back to returning the original name
    return { originalName: artistName, cleanedName: artistName };
  }
}

/**
 * Check if an artist name is similar to existing artists in the database
 * @param artistName The artist name to check
 * @param existingArtists Array of existing artist names
 * @returns Object with normalized name and whether it's a duplicate
 */
export async function checkArtistSimilarity(
  artistName: string,
  existingArtists: string[]
): Promise<{ normalizedName: string; isDuplicate: boolean; duplicateOf?: string; confidence?: number }> {
  if (!artistName || existingArtists.length === 0) {
    return { normalizedName: artistName, isDuplicate: false };
  }
  
  try {
    const systemPrompt = `
      You are an expert system that specializes in identifying musical artist name variations and duplicates.
      Your task is to normalize artist names and detect if a new artist name is a variation or duplicate of existing artists.
      Consider things like:
      1. Different spellings or formats (e.g., "The Band" vs "The Band!")
      2. Inclusion/exclusion of "The" prefix (e.g., "The Band" vs "Band")
      3. Abbreviations and acronyms (e.g., "Rage Against the Machine" vs "RATM")
      4. Common variations in artist names (e.g., "John Smith" vs "John Smith Band")
      5. Typos and misspellings
      
      Always return a JSON object with these fields:
      - normalizedName: The standardized version of the input artist name
      - isDuplicate: true if the artist is likely a duplicate of an existing artist
      - duplicateOf: The name of the existing artist it's a duplicate of (if isDuplicate is true)
      - confidence: A number between 0-1 indicating your confidence in the duplicate detection
    `;
    
    const prompt = `
      New artist name: "${artistName}"
      
      Existing artists:
      ${existingArtists.map(a => `- "${a}"`).join('\n')}
      
      Analyze if the new artist name is a duplicate or variation of any existing artist.
      Return your analysis as a JSON object.
    `;
    
    const response = await callOpenRouter(prompt, { 
      systemPrompt,
      temperature: 0.1 // Lower temperature for more deterministic results
    });
    
    // Parse the response as JSON
    try {
      const result = JSON.parse(response);
      return {
        normalizedName: result.normalizedName || artistName,
        isDuplicate: result.isDuplicate || false,
        duplicateOf: result.duplicateOf,
        confidence: result.confidence
      };
    } catch (parseError) {
      console.error('Error parsing OpenRouter response:', parseError);
      // Fall back to returning the original name
      return { normalizedName: artistName, isDuplicate: false };
    }
  } catch (error) {
    console.error('Error checking artist similarity:', error);
    // Fall back to returning the original name
    return { normalizedName: artistName, isDuplicate: false };
  }
} 