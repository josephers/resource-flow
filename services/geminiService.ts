import { GoogleGenAI } from "@google/genai";
import { Project, TeamMember, Role, Allocation } from "../types";
import { getBusinessHoursInMonth } from "../utils";

interface AnalysisContext {
  projects: Project[];
  members: TeamMember[];
  roles: Role[];
  allocations: Allocation[];
}

export const analyzeResourceForecast = async (context: AnalysisContext): Promise<string> => {
  try {
    // Initialize Gemini AI client using the API key from environment variables
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Prepare a summary of the data for the prompt
    const uniqueMonths = Array.from(new Set(context.allocations.map(a => a.month))).sort();
    
    const summary = {
      totalProjects: context.projects.length,
      totalMembers: context.members.length,
      activeMonths: uniqueMonths,
      roles: context.roles.map(r => `${r.title} ($${r.defaultHourlyRate}/hr)`).join(', '),
      overAllocations: [] as string[],
    };

    // Simple pre-check for obvious issues to guide the AI
    context.members.forEach(member => {
        uniqueMonths.forEach(month => {
            const totalAlloc = context.allocations
                .filter(a => a.memberId === member.id && a.month === month)
                .reduce((sum, a) => sum + a.percentage, 0);
            
            if (totalAlloc > 100) {
                summary.overAllocations.push(`${member.name} is at ${totalAlloc}% in ${month}`);
            }
        });
    });

    const prompt = `
      You are a Senior Project Manager and Resource Planner. Analyze the following project resource data and provide a concise strategic assessment.
      
      **Context:**
      - Roles: ${summary.roles}
      - Active Projects: ${context.projects.map(p => p.name).join(', ')}
      - Timeline: ${summary.activeMonths.join(', ')}
      
      **Detected Issues:**
      ${summary.overAllocations.length > 0 ? summary.overAllocations.join('\n') : "No direct over-allocations (>100%) detected."}
      
      **Request:**
      1. Identify potential risks (burnout, under-utilization, budget risks).
      2. Suggest optimization strategies.
      3. Comment on the role mix vs project needs if apparent.
      
      Keep the tone professional, helpful, and concise (max 300 words). Use bullet points.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Unable to generate analysis.";

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Error generating analysis. Please ensure your API key is configured correctly.";
  }
};