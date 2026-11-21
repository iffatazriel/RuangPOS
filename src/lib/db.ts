import Dexie, { type EntityTable } from 'dexie'
import { totals, type Product, type Category, type Sale, type Settings, type Backup } from './logic'
export const defaults: Settings = { name:'Ruang Kopi', address:'Jl. Melati No. 12, Bandung', phone:'', footer:'Terima kasih, sampai jumpa kembali!', tax:0 }
const db = new Dexie('ruangpos') as Dexie & { products: EntityTable<Product,'id'>; categories: EntityTable<Category,'id'>; sales: EntityTable<Sale,'id'>; settings: EntityTable<Settings & {id:string},'id'> }
db.version(1).stores({products:'id, category, active',categories:'id',sales:'id, date',settings:'id'})
export { db }
export async function getBackup(): Promise<Backup> { return {version:1,products:await db.products.toArray(),categories:await db.categories.toArray(),sales:await db.sales.toArray(),settings:(await db.settings.get('store'))??defaults} }
export async function replaceData(b: Backup) { await db.transaction('rw',db.tables,async()=>{await Promise.all(db.tables.map(t=>t.clear()));await db.products.bulkPut(b.products);await db.categories.bulkPut(b.categories);await db.sales.bulkPut(b.sales);await db.settings.put({...b.settings,id:'store'})}) }
export async function saveSale(sale: Sale) { await db.transaction('rw',db.products,db.sales,async()=>{for(const i of sale.items){const p=await db.products.get(i.productId);if(!p||!p.active)throw new Error('Produk tidak tersedia.');if(p.stock!==null){if(p.stock<i.qty)throw new Error(`Stok ${p.name} tidak cukup.`);await db.products.update(p.id,{stock:p.stock-i.qty})}}await db.sales.add(sale)}) }
export async function voidSale(id:string) { await db.transaction('rw',db.products,db.sales,async()=>{const s=await db.sales.get(id);if(!s||s.voided)return;for(const i of s.items){const p=await db.products.get(i.productId);if(p&&p.stock!==null)await db.products.update(p.id,{stock:p.stock+i.qty})}await db.sales.update(id,{voided:true})}) }
export async function seed() {
 const categories=[{id:'kopi',name:'Kopi'},{id:'minuman',name:'Non-kopi'},{id:'makanan',name:'Makanan'},{id:'camilan',name:'Camilan'}]
 const products:Product[]=[['Es Kopi Susu','kopi',18000,'🧋'],['Americano','kopi',15000,'☕'],['Cappuccino','kopi',22000,'☕'],['Matcha Latte','minuman',24000,'🍵'],['Es Cokelat','minuman',20000,'🥤'],['Nasi Goreng','makanan',28000,'🍛'],['Roti Bakar','camilan',16000,'🍞'],['Kentang Goreng','camilan',18000,'🍟']].map((p,i)=>({id:`p${i}`,name:String(p[0]),category:String(p[1]),price:Number(p[2]),emoji:String(p[3]),stock:100,active:true}))
 const sales:Sale[]=[]
 for(let d=29;d>=0;d--)for(let n=0;n<6+Math.floor(Math.random()*10);n++){const date=new Date();date.setDate(date.getDate()-d);date.setHours(8+n%12,n*3,0,0);const p=products[Math.floor(Math.random()*products.length)];const items=[{productId:p.id,name:p.name,emoji:p.emoji,price:p.price,qty:1+Math.floor(Math.random()*3)}];const sum=totals(items,0,0);sales.push({id:crypto.randomUUID(),date:date.toISOString(),items,...sum,method:['Tunai','QRIS','Transfer'][n%3],cash:sum.total,voided:false})}
 await replaceData({version:1,products,categories,sales,settings:defaults})
}
