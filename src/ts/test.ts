import { Matrix } from "./matrix";
import { RNN } from "./rnn";

let x: Matrix = new Matrix([[1, 0], [3, 4]]);
let y: Matrix = new Matrix([[5, 6], [7, 8]]);

console.log(x.add(y));
console.log(x.subtract(y));
console.log(x.multiply(y));
console.log(x.matmul(y));
console.log(y.transpose());
console.log(Matrix.argmax(x, 0));
console.log(Matrix.argmax(x, 1));

let input_dim = 10;
let hidden_dim = 10;
let output_dim = 10;
let seq_len = 10;

let inputs_series : Matrix = (()=>{
    let ret = Matrix.zeros([seq_len, input_dim]);
    for (let i = 0; i < seq_len; ++i)
    {
        ret.set(i, i % 10, 1); 
    }
    return ret;
})();

let targets_series : Matrix = (()=>{
    let ret = Matrix.zeros([seq_len, output_dim]);
    for (let i = 0; i < seq_len; ++i)
    {
        ret.set(i, (i + 5) % 10, 1); 
    }
    return ret;
})();

let test_inputs_series : Matrix = (()=>{
    let ret = Matrix.zeros([seq_len, input_dim]);
    for (let i = 0; i < seq_len; ++i)
    {
        ret.set(i, (i + 2) % 10, 1); 
    }
    return ret;
})();


let rnn = new RNN(seq_len, input_dim, hidden_dim, output_dim);
console.log("training");
for (let i = 0; i < 10; ++i)
{
console.log(rnn.train(
    inputs_series,
    targets_series,
    1e-1
));
}
console.log("predicting");
let outputs_series = rnn.predict(test_inputs_series);
console.log(Matrix.argmax(test_inputs_series, 1).toString());
console.log(Matrix.argmax(outputs_series, 1).toString());