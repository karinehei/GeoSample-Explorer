using GeoSampleExplorer.Api.Models;

namespace GeoSampleExplorer.Api.Data;

public static class SeedData
{
    public static void Seed(AppDbContext db)
    {
        if (db.Observations.Any()) return;

        var baseDate = new DateTime(2024, 1, 15, 10, 0, 0, DateTimeKind.Utc);
        var observations = new[]
        {
            new Observation { Name = "Berlin Soil Sample", Type = "Soil", Region = "North", Latitude = 52.52, Longitude = 13.405, Description = "Urban soil sample", ObservedAt = baseDate },
            new Observation { Name = "Munich Water Test", Type = "Water", Region = "South", Latitude = 48.1351, Longitude = 11.5820, Description = "Water quality check", ObservedAt = baseDate.AddDays(1) },
            new Observation { Name = "Cologne Rock Formation", Type = "Rock", Region = "West", Latitude = 50.9375, Longitude = 6.9603, Description = "Rock formation", ObservedAt = baseDate.AddDays(2) },
            new Observation { Name = "Hamburg Mineral Deposit", Type = "Mineral", Region = "North", Latitude = 53.5511, Longitude = 9.9937, Description = "Mineral deposit", ObservedAt = baseDate.AddDays(3) },
            new Observation { Name = "Frankfurt Soil Core", Type = "Soil", Region = "Central", Latitude = 50.1109, Longitude = 8.6821, Description = "Deep soil core", ObservedAt = baseDate.AddDays(4) },
            new Observation { Name = "Stuttgart Water Sample", Type = "Water", Region = "South", Latitude = 48.7758, Longitude = 9.1829, Description = "Groundwater sample", ObservedAt = baseDate.AddDays(5) },
            new Observation { Name = "Dresden Sediment", Type = "Rock", Region = "East", Latitude = 51.0504, Longitude = 13.7373, Description = "Sediment layer", ObservedAt = baseDate.AddDays(6) },
            new Observation { Name = "Leipzig Clay Sample", Type = "Soil", Region = "East", Latitude = 51.3397, Longitude = 12.3731, Description = "Clay deposit", ObservedAt = baseDate.AddDays(7) },
            new Observation { Name = "Bremen River Water", Type = "Water", Region = "North", Latitude = 53.0793, Longitude = 8.8017, Description = "River water sample", ObservedAt = baseDate.AddDays(8) },
            new Observation { Name = "Hannover Mineral Vein", Type = "Mineral", Region = "North", Latitude = 52.3759, Longitude = 9.7320, Description = "Mineral vein", ObservedAt = baseDate.AddDays(9) },
            new Observation { Name = "Nuremberg Basalt", Type = "Rock", Region = "South", Latitude = 49.4521, Longitude = 11.0767, Description = "Basalt formation", ObservedAt = baseDate.AddDays(10) },
            new Observation { Name = "Düsseldorf Alluvial Soil", Type = "Soil", Region = "West", Latitude = 51.2277, Longitude = 6.7735, Description = "Alluvial deposit", ObservedAt = baseDate.AddDays(11) },
            new Observation { Name = "Essen Lake Water", Type = "Water", Region = "West", Latitude = 51.4556, Longitude = 7.0116, Description = "Lake water sample", ObservedAt = baseDate.AddDays(12) },
            new Observation { Name = "Magdeburg Sandstone", Type = "Rock", Region = "East", Latitude = 52.1205, Longitude = 11.6276, Description = "Sandstone outcrop", ObservedAt = baseDate.AddDays(13) },
        };

        db.Observations.AddRange(observations);
        db.SaveChanges();
    }
}
