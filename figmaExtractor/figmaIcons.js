const axios = require('axios');
const svgSlimming = require('svg-slim');

const allowedVariants = [
  'Language',
  'Size',
  'Direction',
  'Color',
  'Value'
];
const allowedDescriptionKeys = [
  'color',
  'keywords',
  'scalable'
];

/**
 * Checkf if string can be parsed as JSON
 */
const isValidJson = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }

  return true;
};

/**
 * Get figma description from component
 */
const getDescriptionForComponent = (componentId, allComponents) => {

  const compInfo = allComponents[componentId];
  const properties = {};

  const compDescription = compInfo.description;

  if (compDescription.length === 0) {
    return properties;
  }

  const canBeParsed = isValidJson(compDescription);

  if (!canBeParsed) {
    return properties;
  }

  const parsedDescription = JSON.parse(compDescription);

  Object.keys(parsedDescription)
    .forEach((key) => {
      if (allowedDescriptionKeys.indexOf(key) !== -1) {
        properties[key] = parsedDescription[key];
      }
    });

  return properties;
};

const getVariantsFromComponent = (componentName) => {
  // first check for comma separated values
  const separated = componentName.split(',');

  const variants = {};

  separated.forEach((variant) => {
    const cleanVariant = variant.trim();

    allowedVariants.forEach((allowedVariant) => {
      const variantSplit = cleanVariant.split(`${allowedVariant}=`);

      if (variantSplit.length === 2) {
        const variantValue = variantSplit[1].toLowerCase();
        const variantKey = allowedVariant.toLowerCase();

        variants[variantKey] = variantValue;
      }
    });
  });

  return variants;

};

const getFullNameForVariant = (componentName, variants) => {
  const cleanName = componentName.toLowerCase();

  if (!variants) {
    return cleanName;
  }

  let fullName = cleanName;

  Object.keys(variants)
    .forEach((key) => {

      const value = variants[key];

      fullName += `-${value}`;
    });

  return fullName;
};

const getComponentsFromFrame = (item, frameName, pageName, allComponents, ignorePattern, _components, _currentComponentName) => {
  const keyChildren = 'children';
  const keyType = 'type';
  const valueTypeComponent = 'COMPONENT';
  const components = _components || [];
  let currentComponentName = _currentComponentName || '';

  // the current item is a component
  const typeIsComponent = item[keyType] === valueTypeComponent;

  if (item.name.indexOf(ignorePattern) !== 0) {

    if (typeIsComponent) {

      /**
       * if we're on first iteration and already found a component,
       * we need to get the name from it
       */
      if (currentComponentName.length === 0) {
        currentComponentName = item.name;
      }

      const variantsFromComponent = getVariantsFromComponent(item.name);

      const iconFullName = getFullNameForVariant(currentComponentName, variantsFromComponent);
      const iconDescription = getDescriptionForComponent(item.id, allComponents);

      components.push({
        category: frameName,
        fullName: iconFullName,
        id: item.id,
        name: currentComponentName,
        properties: iconDescription,
        type: pageName,
        variants: variantsFromComponent
      });

      currentComponentName = '';

    }

    // we have children
    const frameHasChildren = Object.keys(item)
      .indexOf(keyChildren) !== -1;

    if (frameHasChildren) {
      currentComponentName += currentComponentName.length === 0
        ? item.name
        : `-${item.name}`;

      item[keyChildren].forEach((child) => {
        getComponentsFromFrame(child, frameName, pageName, allComponents, ignorePattern, components, currentComponentName);
      });
    }

  }

  return components;
};

/**
 * Get id and name from each child
 */
const getIconNamesAndIds = (frames, pageName, ignorePattern, allComponents) => {
  let icons = [];

  frames.forEach((frame) => {
    const frameName = frame.name;

    frame.children.forEach((child) => {
      const iconsFromFrameChild = getComponentsFromFrame(child, frameName, pageName, allComponents, ignorePattern);

      icons = icons.concat(iconsFromFrameChild);

    });
  });

  return icons;
};

const getBatchRequestForIds = (ids, figmaConfig) => {
  const {
    fileId,
    token
  } = figmaConfig;

  const requestHeaders = {
    'X-Figma-Token': token
  };

  const requestConfig = {
    headers: requestHeaders,
    method: 'GET',
    url: `https://api.figma.com/v1/images/${fileId}/?ids=${ids.join(',')}&format=svg`
  };

  return requestConfig;
};

const getIconsUrlsRequestBatches = (ids, figmaConfig) => {
  const batches = [];
  const batchSize = 200;
  let batch = [];

  console.log(`SVG INFO: fetch svg url's in batches of ${batchSize} ids.`);

  while (ids.length > 0) {
    if (batch.length < batchSize) {
      batch.push(ids[0]);

      // this is the last iteration
      if (ids.length === 1) {
        batches.push(getBatchRequestForIds(batch, figmaConfig));
      }
    } else {
      batches.push(getBatchRequestForIds(batch, figmaConfig));
      batch = [ids[0]];
    }

    ids.shift();
  }

  console.log(`SVG INFO: ${batches.length} svg url batches.`);

  return batches;
};

/**
 * Generate a request to the Figma api for each icon the get the svg-url
 */
const getIconsUrls = async (figmaConfig, icons, pageName) => {
  console.log(`SVG INFO: start fetching ${icons.length} svg urls for page: ${pageName}.`);

  const iconIds = [];

  icons.forEach((icon) => {
    iconIds.push(icon.id);
  });

  const requestBatches = getIconsUrlsRequestBatches(iconIds, figmaConfig);
  const results = {};
  let batchCounter = 1;

  for await (const batch of requestBatches) {
    const result = await axios.request(batch);

    console.log(`SVG INFO: Fetched batch ${batchCounter}.`);

    batchCounter++;

    Object.keys(result.data.images)
      .forEach((key) => {
        results[key] = result.data.images[key];
      });
  }

  return results;



  /*
  const {
    fileId,
    token
  } = figmaConfig;

  const requestHeaders = {
    'X-Figma-Token': token
  };

  const requestConfig = {
    headers: requestHeaders,
    method: 'GET',
    url: `https://api.figma.com/v1/images/${fileId}/?ids=${iconIds.join(',')}&format=svg`
  };

  const result = await axios.request(requestConfig);

  return result;
  */
};

/**
 * Make an object for each icon with id, name and url
 */
const getMergedIdsAndNames = (icons, urls) => {

  icons.forEach((icon) => {
    const url = urls[icon.id];

    icon.figmaUrl = url;
  });

  return icons;
};

/**
 * Get config for requests for downloading svgs from AWS
 */
const getIconContentsRequests = (iconsInfo) => {
  const configs = [];

  for (const info of iconsInfo) {
    const config = {
      data: info,
      method: 'GET',
      url: info.figmaUrl
    };

    configs.push(config);
  }

  return configs;
};

/**
 * Assuming we have more than 1000 icons, making concurrent request to
 * aws for all icons, we pretty sure soon will hit a rate limit.
 * We create batches of 100 requests, and execute those batches sequentially.
 */
const getRequestBatches = (requests) => {
  const batches = [];
  const batchSize = 100;
  let batch = [];

  console.log(`SVG INFO: fetch in batches of ${batchSize} svgs.`);

  while (requests.length > 0) {
    if (batch.length < batchSize) {
      batch.push(requests[0]);

      // this is the last iteration
      if (requests.length === 1) {
        batches.push(batch);
      }
    } else {
      batches.push(batch);
      batch = [requests[0]];
    }

    requests.shift();
  }

  console.log(`SVG INFO: ${batches.length} batches.`);

  return batches;
};

/**
 * Get all Icons as SVG
 */
const getIconContents = async (iconsInfo, pageName) => {
  console.log(`SVG INFO: start fetching ${iconsInfo.length} svgs for page: ${pageName}.`);

  const requests = getIconContentsRequests(iconsInfo);
  const requestBatches = getRequestBatches(requests);
  let results = [];
  let batchCounter = 1;

  for await (const batch of requestBatches) {

    /**
     * We create the axios request objects here. If we would create the request
     * objects already in the loop where we create the batches, we would start
     * firing all the requests almost simultaniously and thus creating a
     * connection abort from aws or similar api error.
     */

    const promises = [];

    batch.forEach((batchItem) => {
      promises.push(axios.request(batchItem));
    });

    const result = await Promise.all(promises);

    console.log(`SVG INFO: Fetched batch ${batchCounter}.`);

    batchCounter++;

    results = results.concat(result);
  }

  return results;
};

/**
 * Make an object for each icon with id, name and svg-content
 */
const extractSVGContent = async (responses) => {
  const content = [];

  for await (const response of responses) {
    const config = JSON.parse(response.config.data);
    const rawSvgData = response.data;
    const slimConfig = {
      params: {
        angelDigit: 6,
        sizeDigit: 6
      }
    };

    const cleanSvg = await svgSlimming(rawSvgData, slimConfig);

    content.push({
      ...config,
      svg: cleanSvg
    });

  }

  return content;
};

const checkForDuplicates = (icons) => {

  const valueArr = icons.map((item) => item.fullName);

  valueArr.forEach((value) => {
    let counter = 0;

    valueArr.forEach((innerLoopValue) => {
      if (value === innerLoopValue) {
        counter++;
      }

    });

    if (counter > 1) {
      console.log('========');
      console.log(`SVG INFO: error. The name ${value} was used more than once. Please fix this in Figma.`);

      icons.forEach((icon) => {
        if (icon.fullName === value) {
          console.log(`type: ${icon.type}`);
          console.log(`category: ${icon.category}`);
          console.log(`name: ${icon.name}`);
          console.log(`fullName: ${icon.fullName}`);
        }
      });
      console.log('========');

    }
  });

};

module.exports = async (frames, figmaConfig, pageName, ignorePattern, allComponents) => {
  if (frames.length < 1) {
    console.log(`SVG INFO: no frames on page ${pageName}, will return`);

    return [];
  }

  const icons = getIconNamesAndIds(frames, pageName, ignorePattern, allComponents);

  checkForDuplicates(icons);

  const iconsUrlsResponse = await getIconsUrls(figmaConfig, icons, pageName);

  console.log(`SVG INFO: fetched url's to download svgs for page: ${pageName}`);

  const iconsInfo = getMergedIdsAndNames(icons, iconsUrlsResponse);

  const svgResponses = await getIconContents(iconsInfo, pageName);
  const svgContent = await extractSVGContent(svgResponses);

  console.log(`SVG INFO: fetched svg's contents for page: ${pageName}`);

  return svgContent;
};
