import { AfterLoad, BeforeInsert, BeforeUpdate, Column, Entity } from "typeorm";
import bcrypt from "bcrypt";
import { AccountRoles } from "../interfaces/Roles";
import { Base } from "./Base";

@Entity()
export class User extends Base {
  @Column("varchar", { length: 150 })
  public name!: string;

  @Column("varchar")
  public password!: string;

  @Column("varchar", { length: 255 })
  public email!: string;

  @Column("boolean", { default: false })
  public isVerified!: boolean;

  @Column("varchar", { length: 50, nullable: true })
  public isVerifiedToken!: string | null;

  @Column("varchar", { length: 50, nullable: true, default: null })
  public passwordResetToken!: string | null;

  @Column("date", { nullable: true, default: null })
  public passwordResetExpires!: Date | null;

  @Column("enum", { enum: AccountRoles, default: AccountRoles.USER })
  public role!: AccountRoles;

  @Column("boolean", { default: true })
  public isActive!: boolean;

  //Functions
  private tempPassword!: string;

  public getInfo() {
    return {
      name: this.name,
      email: this.email,
      role: this.role,
    };
  }

  public async comparePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }

  @AfterLoad()
  private loadTempPassword(): void {
    this.tempPassword = this.password;
  }

  @BeforeInsert()
  @BeforeUpdate()
  private async hashPassword(): Promise<void> {
    if (this.tempPassword !== this.password) {
      this.password = await bcrypt.hash(this.password, 12);
      this.loadTempPassword();
    }
  }
}
