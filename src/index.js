import round from 'lodash/round';
import capitalize from 'lodash/capitalize';
import sortBy from 'lodash/sortBy';
import indentString from 'indent-string';
import colorsTemplate from './templates/colors.mustache';
import textStylesTemplate from './templates/textStyles.mustache';
import labelTemplate from './templates/label.mustache';
import imageTemplate from './templates/image.mustache';
import frameTemplate from './templates/frame.mustache';
import stackLayoutTemplate from './templates/stacklayout.mustache';
import cssTemplate from './templates/css.mustache';
import resourceDictionaryTemplate from './templates/resourceDictionary.mustache';

function debug(object) { // eslint-disable-line no-unused-vars
  return {
    code: JSON.stringify(object),
    language: 'json',
  };
}

function actualKey(context, key) {
  const duplicateSuffix = context.getOption('duplicateSuffix');
  return key.replace(duplicateSuffix, '').replace(/\s/g, '');
}

function xamlColorHex(color) {
  const hex = color.toHex();
  const a = Math.round(color.a * 255).toString(16);
  return (`#${a}${hex.r}${hex.g}${hex.b}`).toUpperCase();
}

function xamlColorLiteral(context, color) {
  const colorResource = context.project.findColorEqual(color);
  return colorResource
    ? `{StaticResource ${actualKey(context, colorResource.name)}}`
    : xamlColorHex(color);
}

function xamlColor(context, color) {
  return {
    key: actualKey(context, color.name),
    color: xamlColorHex(color),
  };
}

function xamlFontAttributes(fontWeight) {
  switch (fontWeight) {
    case 700: return 'Bold';
    case 800: return 'Bold';
    case 900: return 'Bold';
    case 950: return 'Bold';
    default: return 'None';
  }
}

function toImageName(layerName) {
  const removeUnderLine = layerName.replace('_', ' ');
  const words = removeUnderLine.split(' ');
  let pascalCase = words[0].toLowerCase();
  for (let i = 1; i < words.length; i += 1) {
    pascalCase = pascalCase + words[i].charAt(0).toUpperCase() + words[i].substr(1).toLowerCase();
  }
  const friendlyName = pascalCase.replace(/\s/g, '');
  return friendlyName;
}

function xamlStyle(context, textStyle) {
  const ignoreFontFamily = context.getOption('ignoreFontFamily');
  const textColor = textStyle.color && xamlColorLiteral(context, textStyle.color);
  const textAlignmentMode = context.getOption('textAlignmentMode');
  const hasTextAlignment = textAlignmentMode === 'style';
  return {
    fontSize: round(textStyle.fontSize, 2),
    fontAttributes: xamlFontAttributes(textStyle.fontWeight),
    fontFamily: !ignoreFontFamily && textStyle.fontFamily,
    textColor,
    horizontalTextAlignment: hasTextAlignment && capitalize(textStyle.textAlign),
  };
}

function xamlLabel(context, textLayer) {
  const { textStyle } = textLayer.textStyles[0];
  const textStyleResource = context.project.findTextStyleEqual(textStyle);
  const label = textStyleResource ?
    { style: actualKey(context, textStyleResource.name) }
    : xamlStyle(context, textStyle);
  const textAlignmentMode = context.getOption('textAlignmentMode');
  const hasTextAlignment = textAlignmentMode === 'style';
  label.text = textLayer.content;
  label.horizontalTextAlignment = hasTextAlignment && capitalize(textStyle.textAlign);
  return label;
}

function xamlImage(context, imageLayer) {
  const image = {
    widthRequest: imageLayer.rect.width,
    heightRequest: imageLayer.rect.height,
    source: toImageName(imageLayer.name),
  };
  return image;
}

function xamlFrame(context, frameLayer) {
  const hasShadow = !(frameLayer.shadows === undefined || frameLayer.shadows.length === 0);
  const hasBackgroundColor = !(frameLayer.fills === undefined || frameLayer.fills.length === 0);
  const cornerRadius = frameLayer.borderRadius || 0;
  const hasBorder = !(frameLayer.borders === undefined || frameLayer.borders.length === 0);
  const frame = {
    widthRequest: frameLayer.rect.width,
    heightRequest: frameLayer.rect.height,
    hasShadow,
    cornerRadius,
  };

  if (hasBackgroundColor) {
    const backgroundColor = frameLayer.fills[0].color
    && xamlColorLiteral(context, frameLayer.fills[0].color);
    frame.backgroundColor = backgroundColor;
  }

  if (hasBorder) {
    const outlineColor = frameLayer.borders[0].fill.color &&
     xamlColorLiteral(context, frameLayer.borders[0].fill.color);
    frame.outlineColor = outlineColor;
  }
  return frame;
}

function xamlStackLayout(context, stackLayer) {
  const hasBackgroundColor = !(stackLayer.fills === undefined || stackLayer.fills.length === 0);
  const stackLayout = {
    widthRequest: stackLayer.rect.width,
    heightRequest: stackLayer.rect.height,
  };

  if (hasBackgroundColor) {
    const backgroundColor = stackLayer.fills[0].color
    && xamlColorLiteral(context, stackLayer.fills[0].color);
    stackLayout.backgroundColor = backgroundColor;
  }

  return stackLayout;
}

function cssStyle(context, cssLayer) {
  const hasBackgroundColor = !(cssLayer.fills === undefined || cssLayer.fills.length === 0);
  const hasBorder = !(cssLayer.borders === undefined || cssLayer.borders.length === 0);
  const cssItem = {
    className: toImageName(cssLayer.name),
    width: cssLayer.rect.width,
    height: cssLayer.rect.height,
    opacity: cssLayer.opacity,
  };

  if (hasBackgroundColor) {
    const backgroundColor = xamlColorHex(cssLayer.fills[0].color);
    cssItem.backgroundColor = backgroundColor;
  }

  if (hasBorder) {
    const borderColor = xamlColorHex(cssLayer.borders[0].fill.color);
    cssItem.borderColor = borderColor;
    cssItem.borderWidth = cssLayer.borders[0].thickness;
  }

  return cssItem;
}

function xamlCode(code) {
  return {
    code,
    language: 'xml',
  };
}

function xamlFile(code, filename) {
  return {
    code,
    language: 'xml',
    filename,
  };
}

function cssCode(code) {
  return {
    code,
    language: 'css',
  };
}

function comment(context, text) {
  return `<!-- ${text} -->`;
}

function styleguideColors(context, colors) {
  const sortResources = context.getOption('sortResources');
  const duplicateSuffix = context.getOption('duplicateSuffix');
  let processedColors = colors;

  if (sortResources) {
    processedColors = sortBy(processedColors, 'name');
  }

  if (duplicateSuffix) {
    processedColors = processedColors.filter(color => !color.name.endsWith(duplicateSuffix));
  }

  const code = colorsTemplate({
    colors: processedColors.map(color => xamlColor(context, color)),
  });

  return xamlCode(code);
}

function styleguideTextStyles(context, textStyles) {
  const sortResources = context.getOption('sortResources');
  const duplicateSuffix = context.getOption('duplicateSuffix');
  let processedTextStyles = textStyles;

  if (sortResources) {
    processedTextStyles = sortBy(processedTextStyles, 'name');
  }

  if (duplicateSuffix) {
    processedTextStyles = processedTextStyles
      .filter(textStyle => !textStyle.name.endsWith(duplicateSuffix));
  }

  const code = textStylesTemplate({
    styles: processedTextStyles.map(textStyle => xamlStyle(context, textStyle)),
  });

  return xamlCode(code);
}

function exportStyleguideColors(context, colors) {
  const resources = indentString(styleguideColors(context, colors).code, 4);
  const resourceDictionary = resourceDictionaryTemplate({ resources });
  return xamlFile(resourceDictionary, 'Colors.xaml');
}

function exportStyleguideTextStyles(context, textStyles) {
  const resources = indentString(styleguideTextStyles(context, textStyles).code, 4);
  const resourceDictionary = resourceDictionaryTemplate({ resources });
  return xamlFile(resourceDictionary, 'Labels.xaml');
}

function layer(context, selectedLayer) {
  if (selectedLayer.type === 'text') {
    const label = xamlLabel(context, selectedLayer);
    const cssLabelItem = cssStyle(context, selectedLayer);
    const code = labelTemplate(label) + cssTemplate(cssLabelItem);
    return xamlCode(code);
  } else if (selectedLayer.exportable) {
    const image = xamlImage(context, selectedLayer);
    const code = imageTemplate(image);
    return xamlCode(code);
  }

  const frame = xamlFrame(context, selectedLayer);
  const stackLayout = xamlStackLayout(context, selectedLayer);
  const cssItem = cssStyle(context, selectedLayer);
  const code = frameTemplate(frame) + stackLayoutTemplate(stackLayout) + cssTemplate(cssItem);

  return xamlCode(code);
}


function css(context, selectedLayer) {
  const cssItem = cssStyle(context, selectedLayer);
  const code = cssTemplate(cssItem);
  return cssCode(code);
}

const extension = {
  comment,
  styleguideColors,
  styleguideTextStyles,
  exportStyleguideColors,
  exportStyleguideTextStyles,
  layer,
  css,
};

export default extension;
