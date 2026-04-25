import { DataTypes, Model, Optional } from 'sequelize';
import type { Sequelize } from 'sequelize';

export interface RequestItem {
  name: string;
  qty: number;
}

export interface RequestAttributes {
  id: number;
  userId: number;
  employeeEmail: string;
  type: string;
  items: RequestItem[];
  status: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RequestCreationAttributes
  extends Optional<RequestAttributes, 'id' | 'status' | 'date' | 'createdAt' | 'updatedAt'> {}

export class RequestRecord
  extends Model<RequestAttributes, RequestCreationAttributes>
  implements RequestAttributes {
  public id!: number;
  public userId!: number;
  public employeeEmail!: string;
  public type!: string;
  public items!: RequestItem[];
  public status!: string;
  public date!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function (sequelize: Sequelize): typeof RequestRecord {
  RequestRecord.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      employeeEmail: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      items: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Pending',
      },
      date: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'RequestRecord',
      tableName: 'requests',
      timestamps: true,
    }
  );

  return RequestRecord;
}
