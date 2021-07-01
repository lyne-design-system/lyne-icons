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
const getIconUrlRequests = (figmaConfig, icons) => {
  const {
    fileId,
    token
  } = figmaConfig;

  const requestHeaders = {
    'X-Figma-Token': token
  };

  const requestConfig = {
    headers: requestHeaders,
    method: 'GET'
  };

  const requests = [];

  icons.forEach((icon) => {
    requestConfig.url = `https://api.figma.com/v1/images/${fileId}/?ids=${icon.id}&format=svg`;

    requests.push(axios.request(requestConfig));

  });

  return requests;
};

/**
 * Extract the image url from the Figma api response
 */
const getSVGUrls = (iconResponses) => {
  const urls = {};

  iconResponses.forEach((response) => {
    const item = response.data;

    if (item.err !== null) {
      console.log(`ERROR: ${item.err}`);

      return;
    }

    const imagesKeys = Object.keys(item.images);

    if (imagesKeys.length !== 1) {
      console.log('ATTENTION: skip icon because there seem to be multiple images on aws related to that icon');

      return;
    }

    const imageUrl = item.images[imagesKeys[0]];

    urls[imagesKeys[0]] = imageUrl;
  });

  return urls;
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
 * Make a request to AWS for each icon to get the content of the svg
 */
const getIconContentRequests = (iconsInfo) => {
  const requests = [];

  iconsInfo.forEach((info) => {
    const config = {
      data: info,
      method: 'GET',
      url: info.figmaUrl
    };

    const request = axios.request(config);

    requests.push(request);
  });

  return requests;
};

/**
 * Make an object for each icon with id, name and svg-content
 */
const getSVGContent = async (responses) => {
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
  const urlRequests = getIconUrlRequests(figmaConfig, icons);

  const response = [];

  for await (const request of urlRequests) {
    const result = await request;

    response.push(result);
  }

  console.log(`SVG INFO: fetched url's to download svg for page: ${pageName}`);

  const iconUrls = getSVGUrls(response);
  const iconsInfo = getMergedIdsAndNames(icons, iconUrls);
  const iconsContentRequests = getIconContentRequests(iconsInfo);

  const svgResponses = [];

  /**
   * !!Caution!!: using Promise.all() to execute all requests will lead to
   * exceeding Figmas rate limit. so we slow it down by using a for await
   * loop.
   */

  for await (const svgResponse of iconsContentRequests) {
    const result = await svgResponse;

    svgResponses.push(result);
  }

  const svgContent = await getSVGContent(svgResponses);

  console.log(`SVG INFO: fetched svg's contents for page: ${pageName}`);

  console.log(svgResponses);

  return svgContent;
};
