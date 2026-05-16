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
        Rulezi pipeline-ul AI MVP CiviTm pentru Timisoara.
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
          "subcategory": "optional short Romanian label or null",
          "severity": "one allowed severity",
          "summary": "rezumat scurt, prietenos pentru cetateni, in romana, sub 160 de caractere",
          "visibleEvidence": "ce se vede in fotografie, scurt",
          "safetyRisk": "risc de siguranta sau null",
          "confidence": 0.78,
          "isUrgent": false,
          "responsibleActor": "one allowed responsible actor",
          "primaryRoute": "city_hall, community, partner, mixed or unknown",
          "secondaryRoute": "optional route or null",
          "routeReason": "motivul rutei alese, scurt",
          "responsibleActorLabel": "eticheta scurta pentru UI",
          "suggestedAction": "urmatoarea actiune practica, in romana, sub 160 de caractere",
          "publicExplanation": "explicatie publica in romana, maximum 2 propozitii",
          "rewardEligible": true
        }

        Semantica produs:
        - Toti agentii lucreaza pentru CiviTm, platforma de implicare civica pentru Timisoara care transforma sesizarile in actiuni vizibile.
        - isValidIssue trebuie sa fie false cand imaginea nu arata o problema civica reala sau raportabila: poza normala, selfie, mancare, interior privat fara context civic, peisaj fara defect, obiect aleatoriu, captura de ecran irelevanta sau continut care nu poate sustine sesizarea.
        - Daca isValidIssue este false, foloseste category "other", severity "low", responsibleActor "unknown", rewardEligible false, isUrgent false si explica pe scurt in invalidReason de ce nu este raport civic.
        - Daca imaginea este ambigua dar descrierea si locatia sustin clar o problema civica, poti pastra isValidIssue true cu confidence scazut.
        - severity trebuie sa fie doar low, medium, high sau critical. Nu folosi "urgent" ca valoare.
        - Pentru cazuri urgente de siguranta, foloseste severity "critical" si isUrgent true.
        - responsibleActor spune cine poate impinge realist rezolvarea: citizen, community, city_hall, private_company, emergency, unknown sau community_and_city_hall.
        - primaryRoute este informatie extra pentru RawResponseJson: city_hall, community, partner, mixed sau unknown.
        - Maparea route -> responsibleActor este: city_hall -> city_hall, community -> community, mixed -> community_and_city_hall. Partner nu este responsibleActor; foloseste rewardEligible true cand partenerii pot ajuta.
        - O misiune nu este responsibleActor. O misiune este o actiune comunitara organizata ulterior, cu loc, interval de timp, participanti si obiectiv.
        - Foloseste rewardEligible true doar pentru probleme mari de gunoi/salubrizare unde o misiune comunitara sigura chiar are sens: deseuri voluminoase, moloz, saci multi, gramezi de gunoi, mobila/saltele abandonate, containere pline, depozit ilegal sau resturi de constructii.
        - Foloseste rewardEligible false pentru gunoi mic pe care il poate rezolva un cetatean singur: o sticla, un ambalaj, hartie, doza, un PET, mucuri de tigara sau o punga izolata.
        - Foloseste rewardEligible false pentru lucrari tehnice, infrastructura, urgente, utilitati, graffiti, spatii verzi, trotuare blocate, iluminat defect sau cazuri care trebuie doar trimise catre primarie/companie.
        - Nu inventa date indisponibile, parteneri, recompense, decizii ale autoritatilor sau responsabilitati legale.
        - Cand exista incertitudine, explica ce lipseste si pastreaza confidence realist.

        Context raport:
        - Descriere utilizator: {{issue.Description ?? "Nu a fost oferita o descriere."}}
        - Zona: {{issue.Zone?.Name ?? "Necunoscuta"}}
        - Coordonate: {{issue.Latitude}}, {{issue.Longitude}}
        - Titlu curent issue: {{issue.Title}}

        Limba:
        - Valorile enum precum category, severity si responsibleActor raman exact in engleza, din listele permise.
        - Campurile text pentru UI trebuie sa fie in romana, fara diacritice.
        """;
    }
}
