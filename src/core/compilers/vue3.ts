import { importModule } from 'local-pkg';
import { handleSVGId } from '../svgId';
import type { Compiler } from './types';

export const Vue3Compiler = <Compiler>(async (svg: string, collection: string, icon: string) => {
  const { compileTemplate } = await importModule('@vue/compiler-sfc');

  const { injectScripts, svg: svghandled } = handleSVGId(svg);
  let handled = svghandled;

  const index1 = svghandled.indexOf('.cls-1');
  let existStyle = index1 > 0;
  let classArray;
  if (existStyle) {
    const index2 = svghandled.indexOf('</style>');
    const classList = svghandled.substring(index1, index2);
    classArray = classList.split(/[{}]/);
  }
  if (classArray) {
    let className: string;
    for (let i = 0; i < classArray.length; i++) {
      const tmp = classArray[i];
      if (!!tmp) {
        if (tmp.startsWith('.')) {
          const name = tmp.substring(1);
          className = `class="${name}"`;
        } else {
          const fieldArray = tmp.split(';');
          fieldArray.forEach(it => {
            const itArr = it.split(':');
            if (itArr && itArr.length === 2) {
              const itAttribute = `${itArr[0]}="${itArr[1]}"`;
              handled = handled.replaceAll(className, itAttribute);
            }
          });
        }
      }
    }
  }
  const titleStart = handled.indexOf('<title>');
  const titleEnd = handled.indexOf('/title>');
  //去除title
  if (titleStart > 0) handled = handled.substring(0, titleStart) + handled.substring(titleEnd + 7);
  //去掉默认颜色,改为可变颜色
  const defaultColor = 'fill="#000000"';
  const colorStart = handled.indexOf(defaultColor);
  if (colorStart > 0) {
    const currentColor = 'fill="currentColor"';
    handled = handled.replaceAll(defaultColor, currentColor);
  }

  let { code } = compileTemplate({
    source: handled,
    id: `${collection}:${icon}`,
    filename: `${collection}-${icon}.vue`
  });
  //if (existStyle) code = code.replace('_resolveComponent("ttstyle")', '_resolveComponent("style")');
  code = code.replace(/^export /g, '');
  code += `\n\nexport default { name: '${collection}-${icon}', render${
    injectScripts ? `, data() {${injectScripts};return { idMap }}` : ''
  } }`;
  code += '\n/* vite-plugin-components disabled */';

  return code;
});
