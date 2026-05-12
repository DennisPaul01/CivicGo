using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CivicGo.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Missions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    Description = table.Column<string>(type: "character varying(1200)", maxLength: 1200, nullable: false),
                    ZoneId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CreatedFromIssueId = table.Column<Guid>(type: "uuid", nullable: true),
                    RewardId = table.Column<Guid>(type: "uuid", nullable: true),
                    StartsAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    EndsAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ParticipantsNeeded = table.Column<int>(type: "integer", nullable: false),
                    ImpactPoints = table.Column<int>(type: "integer", nullable: false),
                    CreatedByAi = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Missions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Missions_Issues_CreatedFromIssueId",
                        column: x => x.CreatedFromIssueId,
                        principalTable: "Issues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Missions_Zones_ZoneId",
                        column: x => x.ZoneId,
                        principalTable: "Zones",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "MissionIssues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MissionId = table.Column<Guid>(type: "uuid", nullable: false),
                    IssueId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MissionIssues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MissionIssues_Issues_IssueId",
                        column: x => x.IssueId,
                        principalTable: "Issues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MissionIssues_Missions_MissionId",
                        column: x => x.MissionId,
                        principalTable: "Missions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MissionParticipants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MissionId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    JoinedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    PointsEarned = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MissionParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MissionParticipants_Missions_MissionId",
                        column: x => x.MissionId,
                        principalTable: "Missions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MissionParticipants_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MissionIssues_IssueId",
                table: "MissionIssues",
                column: "IssueId");

            migrationBuilder.CreateIndex(
                name: "IX_MissionIssues_MissionId_IssueId",
                table: "MissionIssues",
                columns: new[] { "MissionId", "IssueId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MissionParticipants_MissionId_UserId",
                table: "MissionParticipants",
                columns: new[] { "MissionId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MissionParticipants_UserId",
                table: "MissionParticipants",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Missions_CreatedFromIssueId",
                table: "Missions",
                column: "CreatedFromIssueId");

            migrationBuilder.CreateIndex(
                name: "IX_Missions_ZoneId",
                table: "Missions",
                column: "ZoneId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MissionIssues");

            migrationBuilder.DropTable(
                name: "MissionParticipants");

            migrationBuilder.DropTable(
                name: "Missions");
        }
    }
}
