import { PrismaClient } from '@prisma/client'
import { query } from 'express'
import { itemRecord, Items } from '../index.d'
import { AnalyticRecords } from '../lib/analyticTimeUtil'
import { UsersModel } from './usersModel'

const prisma = new PrismaClient()

export class ItemsModel extends UsersModel {

  public static async createItem (itemName: string, userName: string, number: number, nextBuyDate: string) {
    const userId = await this.getUserId(userName)
    return await prisma.users_items.create({
      data:{
        userId: userId,
        name: itemName,
        nextBuyDate: new Date(nextBuyDate),
        items_records: {
          create: {
            number: number,
            bought_time: new Date()
          }
        }
      }
    })
  }

  public static async getItem (userName: string, itemId: number){
    const userId = await this.getUserId(userName)
    const nullItem = { data : "cannot find" }
    const item = await prisma.users_items.findMany({
      where: {
        userId: userId,
        id: itemId
      },
      include: {
        items_records: true
      }
    })
    if(item.length === 0) {
      return nullItem
    } else {
      return item
    }

  }

  public static async getAllItems (userName: string) {
    const userId = await this.getUserId(userName)
    const nullItem = { data : "none" }
    const allItems =  await prisma.users_items.findMany({
      where: {
        userId: userId
      },
      include: {
        items_records: true
      }
    })

    if(allItems.length === 0) {
      return nullItem
    } else {
      return allItems
    }
  }

  // public static async createNewItemsRecord(userName: string, itemId: number, itemNumber: number){
  //   const userId = await this.getUserId(userName)
  //   return await prisma.users_items.update({
  //     where: {
  //       id: itemId
  //     },
  //     data: {
  //       nextBuy: new Date('2020-01-02'),
  //       items_records: {
  //         create: {
  //           number: itemNumber
  //         }
  //       }
  //     },
  //     include: {
  //       items_records: true
  //     }
  //   })
  // }

  public static async createNewItemsRecord(userName: string, itemId: number, itemNumber: number){
    const userId = await this.getUserId(userName)
    const allItemsRecords =  await prisma.items_records.findMany({
      where: {
        itemId: itemId
      }
    }) as unknown as itemRecord[]
    const nextDate = await AnalyticRecords.calculateAverage(allItemsRecords, itemNumber)

    return await prisma.users_items.update({
      where: {
        id: itemId
      },
      data: {
        nextBuyDate: new Date(nextDate),
        items_records: {
          create: {
            number: itemNumber
          }
        }
      },
      include: {
        items_records: true
      }
    })
  }

  public static async updateRecordData(itemId: number, itemRecordId: number, newDate: string) {
    return await prisma.items_records.update({
      where: {
        id: itemRecordId
      },
      data: {
        bought_time: new Date(newDate)
      }
    })
  }
}
