export class AxisBreaks extends Array {

    constructor(numberToBreak, numberOfSteps = 10) {
        const {step, length} = AxisBreaks.getSteps(numberToBreak, numberOfSteps);
        super(length)
        for (let i = 0; i < length; i++) this[i] = step * i
    }

    get maxLabel() {
        return this[this.length-1]
    }

    static getSteps(numberToBreak, numberOfSteps) {
        let step =  AxisBreaks.getStep(numberToBreak, numberOfSteps);
        while (step === AxisBreaks.getStep(numberToBreak, numberOfSteps - 1)) {
            numberOfSteps--
        }
        return {step, 'length': numberOfSteps + 1}
    }

    static getStep(numberToBreak, numberOfSteps) {
        let res = numberToBreak / numberOfSteps;
        let num_of_digits = (Math.log(res) * Math.LOG10E + 1 | 0) - 1;
        res = Math.ceil(res / (10 ** (num_of_digits)));
        if ((res % 2 === 1 && res % 5 > 0) && res !== 1) {
            res++
        }
        if (res % 6 === 0 || res % 8 === 0) {
            res = 10
        }
        return res * (10 ** (num_of_digits))
    }

}