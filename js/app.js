import {WorkplaceView} from "./view/workplaceView.js";
import {WorkplaceController} from "./controller/workplaceController.js";

window.workplace = new WorkplaceView(new WorkplaceController());
window.workplace.init();


//TODO NAAPLIKOVAT V CONTROLLERU - MODAL
// function applyAoiModifications(stimulusIndex) {
//     let orderArr = [];
//     const aoiInputs = document.getElementById("aoiPopAttributesTable").getElementsByTagName("input");
//     const INPUTS_PER_LINE = 3; //per one aoi category in pop-up modifier
//     for (let i = 0; i < aoiInputs.length; i += INPUTS_PER_LINE) {
//         const aoiCategoryIndex = Number(aoiInputs[i + 2].value);
//         const colorValue = aoiInputs[i + 1].value;
//         const nameValue = aoiInputs[i].value;
//         data.setAoiColor(stimulusIndex, aoiCategoryIndex, colorValue);
//         data.setAoiName(stimulusIndex, aoiCategoryIndex, nameValue);
//         orderArr.push(aoiCategoryIndex); //order array
//     }
//     data.setAoiOrder(stimulusIndex, orderArr); //save order array
//     document.getElementsByClassName('chartwrap')[0].innerHTML = new ScarfPrinter(stimulusIndex).innerPlot; //repaint chart
//     closePopUp();
// }