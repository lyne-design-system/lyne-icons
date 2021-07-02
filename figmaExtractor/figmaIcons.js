const axios = require('axios');
const svgSlimming = require('svg-slimming');

/**
 * Get size from icon variant name. We get "Size=small" from Figma...
 */
const getIconSizeFromVariant = (variantName) => {
  const sizePrefix = 'Size=';

  const variantNameSplit = variantName.split(sizePrefix);

  if (variantNameSplit.length === 2) {
    return variantNameSplit[1];
  }

  return false;
};

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
  const compDescription = compInfo.description;

  if (compDescription.length === 0) {
    return '';
  }

  const canBeParsed = isValidJson(compDescription);

  if (canBeParsed) {
    return JSON.parse(compDescription);
  }

  return '';
};

/**
 * Get id and name from each child
 */
const getIconNamesAndIds = (frames, pageName, ignorePattern, allComponents) => {
  const icons = [];

  frames.forEach((frame) => {
    const frameName = frame.name;

    frame.children.forEach((child) => {
      const iconName = child.name;
      const shouldIgnore = iconName.indexOf(ignorePattern) === 0;

      if (!shouldIgnore) {
        child.children.forEach((childrenChild) => {
          const variantName = getIconSizeFromVariant(childrenChild.name);
          const description = getDescriptionForComponent(childrenChild.id, allComponents);

          if (variantName) {
            const variantFullName = `${iconName}-${variantName}`;

            const childrenData = {
              category: frameName,
              description,
              fullName: variantFullName,
              id: childrenChild.id,
              name: iconName,
              type: pageName,
              variant: variantName
            };

            icons.push(childrenData);
          }
        });
      }

    });
  });

  return icons;
};

/**
 * Generate a request to the Figma api for each icon the get the svg-url
 */
const getIconsUrls = async (figmaConfig, icons) => {
  const iconIds = [];

  icons.forEach((icon) => {
    iconIds.push(icon.id);
  });

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
 * Assuming we have more than 1000 icons, making concurrent request to aws
 * for all icons, we pretty sure soon will hit a rate limit.
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
const getIconContents = async (iconsInfo) => {
  console.log(`SVG INFO: start fetching ${iconsInfo.length} svgs.`);

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
    const cleanSvg = await svgSlimming(rawSvgData);

    content.push({
      ...config,
      svg: cleanSvg
    });
  }

  return content;
};

module.exports = async (frames, figmaConfig, pageName, ignorePattern, allComponents) => {
  if (frames.length < 1) {
    return [];
  }

  const icons = getIconNamesAndIds(frames, pageName, ignorePattern, allComponents);
  const iconsUrlsResponse = await getIconsUrls(figmaConfig, icons);

  console.log(`SVG INFO: fetched url's to download svgs for page: ${pageName}`);

  const iconsInfo = getMergedIdsAndNames(icons, iconsUrlsResponse.data.images);

  const svgResponses = await getIconContents(iconsInfo);
  const svgContent = await extractSVGContent(svgResponses);

  console.log(`SVG INFO: fetched svg's contents for page: ${pageName}`);

  return svgContent;
};
