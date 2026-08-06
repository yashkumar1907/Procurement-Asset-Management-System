const ContractRecord = require("../models/ContractRecord");
const AMCRecord = require("../models/AmcRecord");
const InventoryHardwareRecord = require("../models/InventoryHardwareRecord");
const InventoryNetworkRecord = require("../models/InventoryNetworkRecord");
const NetworkRecord = require("../models/NetworkRecord");
const PlantMaterialRecord = require("../models/PlantMaterialRecord");
const PlantServiceRecord = require("../models/PlantServiceRecord");

const MODELS = {
    contract: ContractRecord,
    amc: AMCRecord,
    inventoryHardware: InventoryHardwareRecord,
    inventoryNetwork: InventoryNetworkRecord,
    network: NetworkRecord,
    plantMaterial: PlantMaterialRecord,
    plantService: PlantServiceRecord
};

function getSchemaDescription() {

    let output = "";

    const collections = Object.entries(MODELS).sort(([a], [b]) => a.localeCompare(b));
    
    for (const [collection, model] of collections) {

        output += `Collection: ${collection}\n`;

        const fields = Object.keys(model.schema.paths).sort();

        const ignoredFields = [
            "_id",
            "__v",
            "createdAt",
            "updatedAt"
        ];

        fields.forEach(field => {
            
            if (ignoredFields.includes(field)) return;

            const type = model.schema.paths[field].instance;

            output += `• ${field} (${type})\n`;

        });

        output += "\n";

    }

    return output;

}

const VALID_COLLECTIONS = Object.keys(MODELS);

module.exports = {
    getSchemaDescription,
    VALID_COLLECTIONS,
    MODELS
};