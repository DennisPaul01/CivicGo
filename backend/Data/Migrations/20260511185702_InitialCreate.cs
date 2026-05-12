using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CivicGo.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PublicActivityFeedItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Title = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    Message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    RelatedIssueId = table.Column<Guid>(type: "uuid", nullable: true),
                    RelatedMissionId = table.Column<Guid>(type: "uuid", nullable: true),
                    RelatedRewardId = table.Column<Guid>(type: "uuid", nullable: true),
                    RelatedZoneId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PublicActivityFeedItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SupabaseUserId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    FullName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    AvatarUrl = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    Role = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Points = table.Column<int>(type: "integer", nullable: false),
                    RankId = table.Column<Guid>(type: "uuid", nullable: true),
                    TrustScore = table.Column<int>(type: "integer", nullable: false),
                    FavoriteZoneId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Zones",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: false),
                    Longitude = table.Column<double>(type: "double precision", nullable: false),
                    PolygonGeoJson = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Zones", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Issues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    Description = table.Column<string>(type: "character varying(1200)", maxLength: 1200, nullable: true),
                    Category = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Severity = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    ResponsibleActor = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    AfterImageUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    Latitude = table.Column<double>(type: "double precision", nullable: false),
                    Longitude = table.Column<double>(type: "double precision", nullable: false),
                    LocationPoint = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    ZoneId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConfirmedCount = table.Column<int>(type: "integer", nullable: false),
                    DuplicateCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ResolvedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Issues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Issues_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Issues_Zones_ZoneId",
                        column: x => x.ZoneId,
                        principalTable: "Zones",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Issues_CreatedByUserId",
                table: "Issues",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Issues_ZoneId",
                table: "Issues",
                column: "ZoneId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_SupabaseUserId",
                table: "Users",
                column: "SupabaseUserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Zones_Name",
                table: "Zones",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Issues");

            migrationBuilder.DropTable(
                name: "PublicActivityFeedItems");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Zones");
        }
    }
}
