namespace CivicGo.Api.Issues;

public static class IssueCategories
{
    public const string Other = "other";
    public const string Animals = "animals";
    public const string WaterSewerHeating = "water_sewer_heating";
    public const string EnvironmentalPermits = "environmental_permits";
    public const string ConstructionLand = "construction_land";
    public const string PopulationRecords = "population_records";
    public const string GaragesCemeteriesPublicToilets = "garages_cemeteries_public_toilets";
    public const string PublicLighting = "public_lighting";
    public const string EnvironmentPlaygroundsGreenSpaces = "environment_playgrounds_green_spaces";
    public const string PublicOrder = "public_order";
    public const string OwnersAssociations = "owners_associations";
    public const string IntegrityIssues = "integrity_issues";
    public const string EmployeeIntegrityIssues = "employee_integrity_issues";
    public const string AdvertisingCommerce = "advertising_commerce";
    public const string SanitationPestSnow = "sanitation_pest_snow";
    public const string SchoolsHospitals = "schools_hospitals";
    public const string StreetsSidewalks = "streets_sidewalks";
    public const string Timpark = "timpark";
    public const string RoadTrafficSigns = "road_traffic_signs";
    public const string PublicTransport = "public_transport";
    public const string Urbanism = "urbanism";
    public const string WebsitePlatform = "website_platform";
    public const string ConstructionSites = "construction_sites";

    public static readonly IReadOnlyList<string> Official = new[]
    {
        Other,
        Animals,
        WaterSewerHeating,
        EnvironmentalPermits,
        ConstructionLand,
        PopulationRecords,
        GaragesCemeteriesPublicToilets,
        PublicLighting,
        EnvironmentPlaygroundsGreenSpaces,
        PublicOrder,
        OwnersAssociations,
        IntegrityIssues,
        EmployeeIntegrityIssues,
        AdvertisingCommerce,
        SanitationPestSnow,
        SchoolsHospitals,
        StreetsSidewalks,
        Timpark,
        RoadTrafficSigns,
        PublicTransport,
        Urbanism,
        WebsitePlatform,
        ConstructionSites,
    };

    public static readonly IReadOnlyList<string> Legacy = new[]
    {
        "waste",
        "road_damage",
        "broken_lighting",
        "lighting",
        "blocked_sidewalk",
        "graffiti",
        "damaged_public_furniture",
        "green_space_issue",
        "green_space",
        "accessibility_issue",
        "public_safety_concern",
        "abandoned_object",
        "water_issue",
        "public_transport_issue",
    };

    public static readonly IReadOnlySet<string> Supported = Official
        .Concat(Legacy)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

    public static string ToPromptList()
    {
        return string.Join(Environment.NewLine, Official.Select(category => $"- {category}"));
    }

    public static bool IsCommunityFriendly(string category)
    {
        return category is SanitationPestSnow or EnvironmentPlaygroundsGreenSpaces or
                GaragesCemeteriesPublicToilets or PublicOrder or StreetsSidewalks or
                PublicLighting or RoadTrafficSigns or PublicTransport or
                "waste" or "graffiti" or "green_space_issue" or "green_space" or
                "blocked_sidewalk" or "accessibility_issue" or "broken_lighting" or
                "road_damage" or "damaged_public_furniture";
    }

    public static bool IsRewardEligible(string category)
    {
        return category is SanitationPestSnow or EnvironmentPlaygroundsGreenSpaces or
                GaragesCemeteriesPublicToilets or PublicOrder or StreetsSidewalks or
                "waste" or "graffiti" or "green_space_issue" or "green_space";
    }

    public static string HumanizeRo(string value)
    {
        return value switch
        {
            Other => "alta problema",
            Animals => "animale",
            WaterSewerHeating => "apa, canalizare si termoficare",
            EnvironmentalPermits => "avize si control mediu",
            ConstructionLand => "constructii si terenuri",
            PopulationRecords => "evidenta persoanelor",
            GaragesCemeteriesPublicToilets => "garaje, cimitire si toalete publice",
            PublicLighting => "iluminat public",
            EnvironmentPlaygroundsGreenSpaces => "mediu, locuri de joaca si spatii verzi",
            PublicOrder => "ordine publica",
            OwnersAssociations => "asociatii de proprietari",
            IntegrityIssues => "probleme de integritate",
            EmployeeIntegrityIssues => "integritate referitoare la angajati",
            AdvertisingCommerce => "publicitate si comert",
            SanitationPestSnow => "salubrizare, dezinsectie, deratizare si deszapezire",
            SchoolsHospitals => "scoli si spitale",
            StreetsSidewalks => "strazi si trotuare",
            Timpark => "Timpark",
            RoadTrafficSigns => "trafic rutier si semne de circulatie",
            PublicTransport => "transport in comun",
            Urbanism => "urbanism",
            WebsitePlatform => "website si platforma de sesizari",
            ConstructionSites => "santiere",
            "waste" => "deseuri",
            "road_damage" => "drum deteriorat",
            "broken_lighting" => "iluminat defect",
            "lighting" => "iluminat",
            "blocked_sidewalk" => "trotuar blocat",
            "graffiti" => "graffiti",
            "damaged_public_furniture" => "mobilier urban deteriorat",
            "green_space_issue" or "green_space" => "spatiu verde",
            "accessibility_issue" => "accesibilitate",
            "public_safety_concern" => "siguranta publica",
            "abandoned_object" => "obiect abandonat",
            "water_issue" => "problema cu apa",
            "public_transport_issue" => "transport public",
            _ => value.Replace('_', ' ')
        };
    }
}
