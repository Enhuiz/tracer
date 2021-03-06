import { Matrix } from "../math/matrix";

export class RNN {
    private series_len: number;
    private input_dim: number;
    private hidden_dim: number;
    private output_dim: number;

    private Wih: Matrix;
    private Whh: Matrix;
    private bh: Matrix;
    private Who: Matrix;
    private bo: Matrix;

    constructor(series_len: number, input_dim: number, hidden_dim: number, output_dim: number) {
        this.series_len = series_len;
        this.input_dim = input_dim;
        this.hidden_dim = hidden_dim;
        this.output_dim = output_dim;
        this.reset();
    }

    reset() {
        this.Wih = Matrix.random([this.input_dim, this.hidden_dim], -0.1, 0.1);
        this.Whh = Matrix.random([this.hidden_dim, this.hidden_dim], -0.1, 0.1);
        this.bh = Matrix.zeros([1, this.hidden_dim]);

        this.Who = Matrix.random([this.hidden_dim, this.output_dim], -0.1, 0.1);
        this.bo = Matrix.zeros([1, this.output_dim]);
    }

    private feedforward(inputs: Matrix, targets?: Matrix,
        prev_state: Matrix = Matrix.zeros([1, this.hidden_dim])): [Matrix, Matrix, number] {

        let states: Matrix = Matrix.zeros([inputs.shape[0] + 1, this.hidden_dim]);
        let outputs: Matrix = Matrix.zeros([inputs.shape[0], this.output_dim]);
        let loss = 0;

        states.setRow(0, prev_state);

        for (let t = 0; t < inputs.shape[0]; ++t) {
            let currentState = Matrix.tanh(inputs.row(t)
                .matmul(this.Wih)
                .add(states.row(t).matmul(this.Whh))
                .add(this.bh));
            states.setRow(t + 1, currentState);

            let currentOutput = currentState.matmul(this.Who).add(this.bo);
            outputs.setRow(t, currentOutput);

            if (targets) {
                loss += Matrix.mean(Matrix.pow(
                    currentOutput.subtract(targets.row(t)), 2));
            }
        }
        return [states, outputs, loss];
    }

    train(inputs: Matrix, targets: Matrix,
        eta: number = 0.3, prev_state: Matrix = Matrix.zeros([1, this.hidden_dim])): number {
        if (inputs.shape[1] !== this.input_dim
            || targets.shape[1] !== this.output_dim
            || prev_state.shape[1] !== this.hidden_dim
            || inputs.shape[0] !== this.series_len
            || targets.shape[0] !== this.series_len) {
            throw new Error("Input mismatch");
        }

        let [states, outputs, loss] = this.feedforward(inputs, targets, prev_state);

        // backward
        let dWih = Matrix.zeros([this.input_dim, this.hidden_dim]);
        let dWhh = Matrix.zeros([this.hidden_dim, this.hidden_dim]);
        let dbh = Matrix.zeros([1, this.hidden_dim]);

        let dWho = Matrix.zeros([this.hidden_dim, this.output_dim]);
        let dbo = Matrix.zeros([1, this.output_dim]);
        let dhnext = Matrix.zeros([1, this.hidden_dim]);

        let douts = outputs.subtract(targets);

        for (let t = inputs.shape[0] - 1; t >= Math.max(inputs.shape[0] - this.series_len, 0); --t) {
            let dout = douts.row(t);
            let currentState = states.row(t + 1);

            dWho.addAssign(currentState.transpose().matmul(dout)); // hidden_dim * output_dim
            dbo.addAssign(dout); // 1 * output_dim

            let dh = dout.matmul(this.Who.transpose()).add(dhnext);  // 1 * hidden_dim
            let dhraw = Matrix.tanh_d(currentState).multiply(dh); // 1 * hidden_dim 

            dbh.addAssign(dhraw); // 1 * hidden_dim
            dWhh.addAssign(states.row(t).transpose().matmul(dhraw));
            dWih.addAssign(inputs.row(t).transpose().matmul(dhraw));

            dhnext = dhraw.matmul(this.Whh.transpose());
        }

        this.Wih.subtractAssign(dWih.clip(-2, 2).multiply(eta));
        this.Whh.subtractAssign(dWhh.clip(-2, 2).multiply(eta));
        this.bh.subtractAssign(dbh.clip(-2, 2).multiply(eta));

        this.Who.subtractAssign(dWho.clip(-2, 2).multiply(eta));
        this.bo.subtractAssign(dbo.clip(-2, 2).multiply(eta));

        return loss;
    }

    predict(inputs: Matrix): Matrix {
        if (inputs.shape[1] !== this.input_dim
            || inputs.shape[0] !== this.series_len) {
            throw new Error("Input mismatch");
        }
        let [states, outputs, loss] = this.feedforward(inputs);
        return outputs;
    }
};