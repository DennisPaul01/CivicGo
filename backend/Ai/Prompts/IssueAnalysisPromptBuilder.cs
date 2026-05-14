using CivicGo.Api.Data.Entities;
using CivicGo.Api.Issues;

namespace CivicGo.Api.Ai.Prompts;

public static class IssueAnalysisPromptBuilder
{
    public static string Build(IssueEntity issue)
    {
        return $$"""
        Rulezi pipeline-ul AI MVP CivicGO.
        Aplica mai intai instructiunile Vision Agent, apoi instructiunile Triage Agent.
        Returneaza doar JSON. Fara markdown. Fara text in afara obiectului JSON.

        {{VisionAgentPrompt.Instructions}}

        {{TriageAgentPrompt.Instructions}}

        Allowed categories:
        {{IssueCategories.ToPromptList()}}

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
          "summary": "rezumat scurt, prietenos pentru cetateni, in romana, sub 160 de caractere",
          "confidence": 0.78,
          "isUrgent": false,
          "responsibleActor": "one allowed responsible actor",
          "suggestedAction": "urmatoarea actiune practica, in romana, sub 160 de caractere",
          "rewardEligible": true
        }

        Context raport:
        - Descriere utilizator: {{issue.Description ?? "Nu a fost oferita o descriere."}}
        - Zona: {{issue.Zone?.Name ?? "Necunoscuta"}}
        - Coordonate: {{issue.Latitude}}, {{issue.Longitude}}
        - Titlu curent issue: {{issue.Title}}

        Limba:
        - Valorile enum precum category, severity si responsibleActor raman exact in engleza, din listele permise.
        - Campurile summary si suggestedAction trebuie sa fie in romana, fara diacritice.
        """;
    }
}
