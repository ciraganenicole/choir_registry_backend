import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateContentFieldsForEntityRelation1766000000001
  implements MigrationInterface
{
  name = 'UpdateContentFieldsForEntityRelation1766000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE content_field_definitions cfd
      SET
        "fieldType" = 'entity_relation',
        validation = '{"targetLinkedEntityType":"Song","multiple":true}'::jsonb
      FROM content_types ct
      WHERE cfd."contentTypeId" = ct.id
        AND ct.code = 'DepartmentPage'
        AND cfd."fieldKey" = 'songs'
    `);

    await queryRunner.query(`
      INSERT INTO content_field_definitions (
        "contentTypeId", "fieldKey", "fieldType", label, required, "sortOrder", validation
      )
      SELECT
        ct.id,
        'rbacDepartmentId',
        'entity_relation',
        'Département (RBAC)',
        false,
        4,
        '{"targetLinkedEntityType":"Department","multiple":false}'::jsonb
      FROM content_types ct
      WHERE ct.code = 'DepartmentPage'
        AND NOT EXISTS (
          SELECT 1 FROM content_field_definitions cfd
          WHERE cfd."contentTypeId" = ct.id AND cfd."fieldKey" = 'rbacDepartmentId'
        )
    `);

    await queryRunner.query(`
      INSERT INTO content_field_definitions (
        "contentTypeId", "fieldKey", "fieldType", label, required, "sortOrder", validation
      )
      SELECT
        ct.id,
        'songs',
        'entity_relation',
        'Songs',
        false,
        8,
        '{"targetLinkedEntityType":"Song","multiple":true}'::jsonb
      FROM content_types ct
      WHERE ct.code = 'Playlist'
        AND NOT EXISTS (
          SELECT 1 FROM content_field_definitions cfd
          WHERE cfd."contentTypeId" = ct.id AND cfd."fieldKey" = 'songs'
        )
    `);

    await queryRunner.query(`
      INSERT INTO content_field_definitions (
        "contentTypeId", "fieldKey", "fieldType", label, required, "sortOrder", validation
      )
      SELECT
        ct.id,
        'songs',
        'entity_relation',
        'Songs',
        false,
        5,
        '{"targetLinkedEntityType":"Song","multiple":true}'::jsonb
      FROM content_types ct
      WHERE ct.code = 'Album'
        AND NOT EXISTS (
          SELECT 1 FROM content_field_definitions cfd
          WHERE cfd."contentTypeId" = ct.id AND cfd."fieldKey" = 'songs'
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE content_field_definitions cfd
      SET
        "fieldType" = 'html',
        validation = NULL
      FROM content_types ct
      WHERE cfd."contentTypeId" = ct.id
        AND ct.code = 'DepartmentPage'
        AND cfd."fieldKey" = 'songs'
    `);

    await queryRunner.query(`
      DELETE FROM content_field_definitions cfd
      USING content_types ct
      WHERE cfd."contentTypeId" = ct.id
        AND cfd."fieldKey" IN ('rbacDepartmentId', 'songs')
        AND ct.code IN ('DepartmentPage', 'Playlist', 'Album')
    `);
  }
}
