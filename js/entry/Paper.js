import Source from '/js/entry/Source.js';

export default class Paper {
    constructor(src){
        this.src = src;
        this.active = false;
        this.x = 0;
        this.y = 0;

        this.canvas = document.createElement("canvas");
        this.canvas.width = this.src.width;
        this.canvas.height = this.src.height;
        this.ctx = this.canvas.getContext("2d");

        this.sliced = document.createElement("canvas");
        this.sliced.width = this.src.width;
        this.sliced.height = this.src.height;
        this.sctx = this.sliced.getContext("2d");

    }

    update(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if(this.active) this.ctx.putImageData(this.src.borderData, 0, 0);
        else this.ctx.putImageData(this.src.imageData, 0, 0);

        this.ctx.drawImage(this.sliced, 0, 0);
    }

    recalculate(){
        let [X, Y, W, H] = this.src.getSize();
        let src = new Source( new ImageData(W, H) );
        
        for(let y = Y; y < Y + H; y ++){
            for(let x = X; x < X + W; x ++){
                let color = this.src.getColor(x, y);
                if(color){
                    src.setColor(x - X, y - Y, color);
                }
            }
        }
        src.borderData = src.getBorderData();
        this.src = src;

        this.x += X;
        this.y += Y;
        this.canvas.width = W;
        this.canvas.height = H;
        
        let slicedSrc = new Source(this.sctx.getImageData(X, Y, W, H));
        this.sliced.width = W;
        this.sliced.height = H;
        this.sctx.clearRect(0, 0, W, H);

        for(let y = 0; y < H; y++){
            for(let x = 0; x < W; x++){
                if(slicedSrc.getColor(x, y) && this.src.isSlicedPixel(x, y)){
                    this.sctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }

    isNear(paper){
        for(let y = this.y; y < this.y + this.src.height; y++){
            for(let x = this.x; x < this.x + this.src.width; x++){
                let tx = x - this.x;
                let ty = y - this.y;

                let px = x - paper.x;
                let py = y - paper.y;

                if(paper.src.getColor(px, py) && this.src.getColor(tx, ty)){
                    return true;
                }
            }
        }
        return false;
    }
}