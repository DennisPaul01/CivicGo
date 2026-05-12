using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CivicGo.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIssueAiAnalyses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IssueAiAnalyses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IssueId = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Severity = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Summary = table.Column<string>(type: "character varying(700)", maxLength: 700, nullable: false),
                    ResponsibleActor = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    SuggestedAction = table.Column<string>(type: "character varying(700)", maxLength: 700, nullable: false),
                    Confidence = table.Column<double>(type: "double precision", nullable: false),
                    IsUrgent = table.Column<bool>(type: "boolean", nullable: false),
                    RewardEligible = table.Column<bool>(type: "boolean", nullable: false),
                    RawResponseJson = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IssueAiAnalyses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IssueAiAnalyses_Issues_IssueId",
                        column: x => x.IssueId,
                        principalTable: "Issues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IssueAiAnalyses_IssueId",
                table: "IssueAiAnalyses",
                column: "IssueId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IssueAiAnalyses");
        }
    }
}
