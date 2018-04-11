import round from 'lodash/round';
import capitalize from 'lodash/capitalize';
import sortBy from 'lodash/sortBy';
import indentString from 'indent-string';
import colorsTemplate from './templates/colors.mustache';
import textStylesTemplate from './templates/textStyles.mustache';
import labelTemplate from './templates/label.mustache';
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

function xamlPointLiteral(point) {
  const x = round(point.x, 2);
  const y = round(point.y, 2);
  return `${x},${y}`;
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

function xamlStyle(context, textStyle) {
  const ignoreFontFamily = context.getOption('ignoreFontFamily');
  const textAlignmentMode = context.getOption('textAlignmentMode');
  const hasTextAlignment = textAlignmentMode === 'style';
  const textColor = textStyle.color && xamlColorLiteral(context, textStyle.color);

  return {
    key: actualKey(context, textStyle.name),
    textColor,
    fontFamily: !ignoreFontFamily && textStyle.fontFamily,
    fontSize: round(textStyle.fontSize, 2),
    fontAttributes: xamlFontAttributes(textStyle.fontWeight),
    horizontalTextAlignment: hasTextAlignment && capitalize(textStyle.textAlign),
  };
}

function xamlLabel(context, textLayer) {
  const textAlignmentMode = context.getOption('textAlignmentMode');
  const hasTextAlignment = textAlignmentMode === 'label';
  const { textStyle } = textLayer.textStyles[0];
  const textStyleResource = context.project.findTextStyleEqual(textStyle);
  const label = textStyleResource ?
    { style: actualKey(context, textStyleResource.name) } : xamlStyle(context, textStyle);

  label.text = textLayer.content;
  label.horizontalTextAlignment = hasTextAlignment && capitalize(textStyle.textAlign);

  return label;
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
    colors: processedColors.map(color => xamlColor(context, color))
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
    const code = labelTemplate(label);
    return xamlCode(code);
  }
  return null;
}

const extension = {
  comment,
  styleguideColors,
  styleguideTextStyles,
  exportStyleguideColors,
  exportStyleguideTextStyles,
  layer,
};

export default extension;
