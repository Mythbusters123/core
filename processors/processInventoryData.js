/*
* Process NBT inventory data
 */

const itemSchema = {
  item_id: 'id',
  count: 'Count',
  name: 'tag.value.display.value.Name',
  lore: 'tag.value.display.value.Lore.value',
  attributes: {
    modifier: 'tag.value.ExtraAttributes.value.modifier',
    enchantments: 'tag.value.ExtraAttributes.value.enchantments',
    origin: 'tag.value.ExtraAttributes.value.originTag',
    id: 'tag.value.ExtraAttributes.value.id',
    uuid: 'tag.value.ExtraAttributes.value.uuid',
    texture: 'tag.value.SkullOwner.value.Properties.value.textures.value',
  },
};

/*
* Allows you to use dot syntax for nested objects, e.g. 'tag.value.display'
 */
function getNestedObjects(obj = {}, path = '') {
  path = path.split('.');
  for (let i = 0; i < path.length; i += 1) {
    if (obj[path[i]] === undefined) {
      break;
    }
    obj = obj[path[i]] || {};
  }
  return obj;
}

/*
* Returns the texture id part from minecraft.net link
* e.g. http://textures.minecraft.net/texture/f715ca0f742544ae3ca104297578c2ed700ea3a54980413512f5e7a0bc06729a
 */
function getTexture(value = []) {
  if (value === null) return null;
  const string = Buffer.from(value[0].Value.value, 'base64').toString();
  const link = JSON.parse(string).textures.SKIN.url;
  const array = link.split('/');
  return array[array.length - 1];
}

/*
* Strips all unnecessary data from item objects
 */
function simplifyItem(item) {
  const x = {
    attributes: {},
  };
  Object.keys(itemSchema).forEach((key) => {
    if (key !== 'attributes') {
      x[key] = getNestedObjects(item, itemSchema[key]).value || null;
    } else {
      Object.keys(itemSchema.attributes).forEach((attribute) => {
        x.attributes[attribute] = getNestedObjects(item, itemSchema.attributes[attribute]).value || null;
      });
      // Prettify enchantments
      const { enchantments } = x.attributes;
      if (typeof enchantments === 'object') {
        Object.keys(enchantments || {}).forEach((enchantment) => {
          x.attributes.enchantments[enchantment] = enchantments[enchantment].value;
        });
      }
      // Decode texture data
      const { texture } = x.attributes;
      if (typeof texture === 'object') {
        x.attributes.texture = getTexture(texture);
      }
    }
  });
  return x;
}

function processInventoryData(data) {
  const inventoryArray = data.value.i.value.value;
  return inventoryArray.map(item => simplifyItem(item));
}

module.exports = processInventoryData;
