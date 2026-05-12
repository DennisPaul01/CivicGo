using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CivicGo.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddZoneScores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ZoneScores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ZoneId = table.Column<Guid>(type: "uuid", nullable: false),
                    CleanlinessScore = table.Column<int>(type: "integer", nullable: false),
                    CommunityScore = table.Column<int>(type: "integer", nullable: false),
                    SafetyScore = table.Column<int>(type: "integer", nullable: false),
                    EngagementScore = table.Column<int>(type: "integer", nullable: false),
                    TotalScore = table.Column<int>(type: "integer", nullable: false),
                    CalculatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZoneScores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ZoneScores_Zones_ZoneId",
                        column: x => x.ZoneId,
                        principalTable: "Zones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ZoneScores_ZoneId_CalculatedAt",
                table: "ZoneScores",
                columns: new[] { "ZoneId", "CalculatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ZoneScores");
        }
    }
}
