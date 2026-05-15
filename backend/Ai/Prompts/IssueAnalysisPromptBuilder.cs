using CivicGo.Api.Data.Entities;
using CivicGo.Api.Issues;

namespace CivicGo.Api.Ai.Prompts;

public static class IssueAnalysisPromptBuilder
{
    public static string Build(
        IssueEntity issue,
        string? visionInstructions = null,
        string? triageInstructions = null
    )
    {
        var configuredVisionInstructions = string.IsNullOrWhiteSpace(visionInstructions)
            ? "Nu exista instructiuni admin suplimentare pentru Vision Agent."
            : visionInstructions.Trim();
        var configuredTriageInstructions = string.IsNullOrWhiteSpace(triageInstructions)
            ? "Nu exista instructiuni admin suplimentare pentru Triage Agent."
            : triageInstructions.Trim();

        return $$"""
        Rulezi pipeline-ul AI MVP CivicGO.
        Aplica mai intai instructiunile Vision Agent, apoi instructiunile Triage Agent.
        Returneaza doar JSON. Fara markdown. Fara text in afara obiectului JSON.

        {{VisionAgentPrompt.Instructions}}

        Instructiuni admin Vision Agent:
        {{configuredVisionInstructions}}

        {{TriageAgentPrompt.Instructions}}

        Instructiuni admin Triage Agent:
        {{configuredTriageInstructions}}

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
          "isValidIssue": true,
          "invalidReason": null,
          "category": "one allowed category",
          "severity": "one allowed severity",
          "summary": "rezumat scurt, prietenos pentru cetateni, in romana, sub 160 de caractere",
          "confidence": 0.78,
          "isUrgent": false,
          "responsibleActor": "one allowed responsible actor",
          "suggestedAction": "urmatoarea actiune practica, in romana, sub 160 de caractere",
          "rewardEligible": true
        }

        Semantica produs:
        - isValidIssue trebuie sa fie false cand imaginea nu arata o problema civica reala sau raportabila: poza normala, selfie, mancare, interior privat fara context civic, peisaj fara defect, obiect aleatoriu, captura de ecran irelevanta sau continut care nu poate sustine sesizarea.
        - Daca isValidIssue este false, foloseste category "other", severity "low", responsibleActor "unknown", rewardEligible false, isUrgent false si explica pe scurt in invalidReason de ce nu este raport civic.
        - Daca imaginea este ambigua dar descrierea si locatia sustin clar o problema civica, poti pastra isValidIssue true cu confidence scazut.
        - responsibleActor spune cine poate impinge realist rezolvarea: citizen, community, city_hall, private_company, emergency, unknown sau community_and_city_hall.
        - O misiune nu este responsibleActor. O misiune este o actiune comunitara organizata ulterior, cu loc, interval de timp, participanti si obiectiv.
        - Foloseste rewardEligible true doar pentru cazuri unde o misiune sigura are sens: cleanup, verificare, documentare, confirmare comunitara sau actiune usoara in spatiu public.
        - Foloseste rewardEligible false pentru lucrari tehnice, infrastructura, urgente, utilitati sau cazuri care trebuie doar trimise catre primarie/companie.

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
