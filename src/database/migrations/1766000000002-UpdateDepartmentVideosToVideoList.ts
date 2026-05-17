import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDepartmentVideosToVideoList1766000000002
  implements MigrationInterface
{
  name = 'UpdateDepartmentVideosToVideoList1766000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE content_field_definitions cfd
      SET
        "fieldType" = 'video_list',
        validation = NULL
      FROM content_types ct
      WHERE cfd."contentTypeId" = ct.id
        AND ct.code = 'DepartmentPage'
        AND cfd."fieldKey" = 'videos'
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
        AND cfd."fieldKey" = 'videos'
    `);
  }
}
