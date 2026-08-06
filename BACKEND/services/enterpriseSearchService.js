const ContractRecord = require("../models/ContractRecord");
const AmcRecord = require("../models/AmcRecord");
const NetworkRecord = require("../models/NetworkRecord");
const InventoryHardwareRecord = require("../models/InventoryHardwareRecord");
const InventoryNetworkRecord = require("../models/InventoryNetworkRecord");
const InventoryDepartmentRecord = require("../models/InventoryDepartmentRecord");
const PlantServiceRecord = require("../models/PlantServiceRecord");
const PlantMaterialRecord = require("../models/PlantMaterialRecord");
const WbsProjectRecord = require("../models/WbsProjectRecord");

async function searchEnterprise(intent) {

    const vendor = intent.filters.vendor;

    if (!vendor) {
        return [];
    }

    const search = {
        vendorName: {
            $regex: vendor,
            $options: "i"
        }
    };
    
    const [
        contractRecords,
        amcRecords,
        networkRecords,
        inventoryHardwareRecords,
        inventoryNetworkRecords,
        inventoryDepartmentRecords,
        plantServiceRecords,
        plantMaterialRecords,
        wbsRecords
    ] = await Promise.all([
    
        ContractRecord.find(search),
    
        AmcRecord.find(search),
    
        NetworkRecord.find(search),
    
        InventoryHardwareRecord.find(search),
    
        InventoryNetworkRecord.find(search),
    
        InventoryDepartmentRecord.find(search),
    
        PlantServiceRecord.find(search),
    
        PlantMaterialRecord.find(search),
    
        WbsProjectRecord.find(search)
    
    ]);
    
    return [
    
        ...contractRecords,
    
        ...amcRecords,
    
        ...networkRecords,
    
        ...inventoryHardwareRecords,
    
        ...inventoryNetworkRecords,
    
        ...inventoryDepartmentRecords,
    
        ...plantServiceRecords,
    
        ...plantMaterialRecords,
    
        ...wbsRecords
    
    ];

}

module.exports = {
    searchEnterprise
};