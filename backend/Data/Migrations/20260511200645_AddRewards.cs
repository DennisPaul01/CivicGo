using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CivicGo.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRewards : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Partners",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(140)", maxLength: 140, nullable: false),
                    LogoUrl = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    Description = table.Column<string>(type: "character varying(700)", maxLength: 700, nullable: false),
                    WebsiteUrl = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    ContactEmail = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Partners", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Rewards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    PartnerId = table.Column<Guid>(type: "uuid", nullable: true),
                    Title = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    Description = table.Column<string>(type: "character varying(900)", maxLength: 900, nullable: false),
                    RequiredPoints = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    ClaimedCount = table.Column<int>(type: "integer", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    MissionId = table.Column<Guid>(type: "uuid", nullable: true),
                    ZoneId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rewards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Rewards_Missions_MissionId",
                        column: x => x.MissionId,
                        principalTable: "Missions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Rewards_Partners_PartnerId",
                        column: x => x.PartnerId,
                        principalTable: "Partners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Rewards_Zones_ZoneId",
                        column: x => x.ZoneId,
                        principalTable: "Zones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "RewardClaims",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RewardId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    MissionId = table.Column<Guid>(type: "uuid", nullable: true),
                    ClaimedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Code = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RewardClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RewardClaims_Missions_MissionId",
                        column: x => x.MissionId,
                        principalTable: "Missions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_RewardClaims_Rewards_RewardId",
                        column: x => x.RewardId,
                        principalTable: "Rewards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RewardClaims_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Missions_RewardId",
                table: "Missions",
                column: "RewardId");

            migrationBuilder.CreateIndex(
                name: "IX_Partners_Name",
                table: "Partners",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RewardClaims_MissionId",
                table: "RewardClaims",
                column: "MissionId");

            migrationBuilder.CreateIndex(
                name: "IX_RewardClaims_RewardId_UserId",
                table: "RewardClaims",
                columns: new[] { "RewardId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RewardClaims_UserId",
                table: "RewardClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Rewards_MissionId",
                table: "Rewards",
                column: "MissionId");

            migrationBuilder.CreateIndex(
                name: "IX_Rewards_PartnerId",
                table: "Rewards",
                column: "PartnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Rewards_Title",
                table: "Rewards",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_Rewards_ZoneId",
                table: "Rewards",
                column: "ZoneId");

            migrationBuilder.AddForeignKey(
                name: "FK_Missions_Rewards_RewardId",
                table: "Missions",
                column: "RewardId",
                principalTable: "Rewards",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Missions_Rewards_RewardId",
                table: "Missions");

            migrationBuilder.DropTable(
                name: "RewardClaims");

            migrationBuilder.DropTable(
                name: "Rewards");

            migrationBuilder.DropTable(
                name: "Partners");

            migrationBuilder.DropIndex(
                name: "IX_Missions_RewardId",
                table: "Missions");
        }
    }
}
