// Simple OpenAI implementation for debugging
export async function searchWithOpenAI(query: string): Promise<{ city: string; country: string; airportCode: string }> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  
  console.log('🔍 OpenAI API Key exists:', !!apiKey);
  console.log('🔍 Query:', query);
  
  if (!apiKey) {
    console.log('❌ No API key found');
    throw new Error('No OpenAI API key');
  }
  
  const prompt = `You are a travel search assistant. For the query "${query}", return ONLY a JSON object in this exact format:
{
  "city": "City Name",
  "country": "Country Name", 
  "airportCode": "XXX"
}

Query: ${query}
JSON response:`;

  console.log('🚀 Making OpenAI request...');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Options: gpt-4o-mini (cheapest), gpt-4o, gpt-4-turbo, gpt-3.5-turbo
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI Response:', data);
    
    const aiResponse = data.choices[0]?.message?.content;
    console.log('🤖 AI Content:', aiResponse);
    
    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(aiResponse);
    console.log('📄 Parsed Result:', parsed);
    
    // Validate the response has required fields
    if (!parsed.city || !parsed.country || !parsed.airportCode) {
      throw new Error('Invalid OpenAI response format');
    }
    
    return parsed;
  } catch (error) {
    console.log('💥 OpenAI Error:', error);
    throw error;
  }
}