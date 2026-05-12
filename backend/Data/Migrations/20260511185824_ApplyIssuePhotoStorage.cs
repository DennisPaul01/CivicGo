using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CivicGo.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class ApplyIssuePhotoStorage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
                VALUES (
                    'issue-photos',
                    'issue-photos',
                    true,
                    10485760,
                    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']::text[]
                )
                ON CONFLICT (id) DO UPDATE
                SET public = EXCLUDED.public,
                    file_size_limit = EXCLUDED.file_size_limit,
                    allowed_mime_types = EXCLUDED.allowed_mime_types;
                """
            );

            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_policies
                        WHERE schemaname = 'storage'
                          AND tablename = 'objects'
                          AND policyname = 'issue_photos_public_read'
                    ) THEN
                        CREATE POLICY issue_photos_public_read
                        ON storage.objects
                        FOR SELECT
                        TO public
                        USING (bucket_id = 'issue-photos');
                    END IF;

                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_policies
                        WHERE schemaname = 'storage'
                          AND tablename = 'objects'
                          AND policyname = 'issue_photos_authenticated_insert'
                    ) THEN
                        CREATE POLICY issue_photos_authenticated_insert
                        ON storage.objects
                        FOR INSERT
                        TO authenticated
                        WITH CHECK (bucket_id = 'issue-photos');
                    END IF;
                END $$;
                """
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DROP POLICY IF EXISTS issue_photos_authenticated_insert ON storage.objects;
                DROP POLICY IF EXISTS issue_photos_public_read ON storage.objects;
                DELETE FROM storage.buckets WHERE id = 'issue-photos';
                """
            );
        }
    }
}
