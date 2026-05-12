using CivicGo.Api.Data.Entities;

namespace CivicGo.Api.Ai.Prompts;

public static class IssueAnalysisPromptBuilder
{
    public static string Build(IssueEntity issue)
    {
        return $$"""
        You are running CivicGO's MVP AI analysis pipeline.
        Apply the Vision Agent instructions first, then the Triage Agent instructions.
        Return only JSON. No markdown. No prose outside the JSON object.

        {{VisionAgentPrompt.Instructions}}

        {{TriageAgentPrompt.Instructions}}

        Allowed categories:
        - waste
        - road_damage
        - broken_lighting
        - blocked_sidewalk
        - graffiti
        - damaged_public_furniture
        - green_space_issue
        - accessibility_issue
        - public_safety_concern
        - abandoned_object
        - water_issue
        - public_transport_issue
        - other

        Allowed severities:
        - low
        - medium
        - high
        - critical

        Allowed responsible actors:
        - citizen
        - community
        - city_hall
        - private_company
        - emergency
        - unknown
        - community_and_city_hall

        Required JSON shape:
        {
          "category": "one allowed category",
          "severity": "one allowed severity",
          "summary": "short citizen-friendly summary under 160 characters",
          "confidence": 0.78,
          "isUrgent": false,
          "responsibleActor": "one allowed responsible actor",
          "suggestedAction": "short practical next action under 160 characters",
          "rewardEligible": true
        }

        Report context:
        - User description: {{issue.Description ?? "No description provided."}}
        - Zone: {{issue.Zone?.Name ?? "Unknown"}}
        - Coordinates: {{issue.Latitude}}, {{issue.Longitude}}
        - Current issue title: {{issue.Title}}
        """;
    }
}
