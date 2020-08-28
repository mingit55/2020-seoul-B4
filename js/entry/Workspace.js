import Select from '/js/entry/Select.js';
import Spin from '/js/entry/Spin.js';
import Cut from '/js/entry/Cut.js';
import Glue from '/js/entry/Glue.js';
import Source from '/js/entry/Source.js'
import Paper from '/js/entry/Paper.js';

export default class Workspace {
    constructor(app){
        this.app = app;
        this.papers = [];

        
        this.canvas = $("#workspace canvas")[0];
        this.ctx = this.canvas.getContext("2d");
        
        this.sliced = document.createElement("canvas");
        this.sliced.width = this.canvas.width;
        this.sliced.height = this.canvas.height;

        this.selectedName = "";
        this.tools = {
            select: new Select(this),
            spin: new Spin(this),
            cut: new Cut(this),
            glue: new Glue(this),
        };
        
        this.render();
        this.setEvents();
    }

    get selectedTool(){
        return this.tools[this.selectedName];
    }    

    async pushPaper({image, width_size, height_size}){
        let img = await new Promise(res => {
            let img = new Image();
            img.src = image;
            img.onload = () => res(img);
        });

        let canvas = document.createElement("canvas");
        canvas.width = width_size;
        canvas.height = height_size;
        let ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width_size, height_size);
        
        let src = new Source( ctx.getImageData(0, 0, width_size, height_size) );
        this.papers.push( new Paper( src ) );
    }

    
    render(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.papers.forEach(paper => {
            paper.update();
            this.ctx.drawImage(paper.canvas, paper.x, paper.y);
            this.ctx.strokeRect(paper.x, paper.y, paper.src.width, paper.src.height);
        });

        this.ctx.drawImage(this.sliced, 0, 0);
        
        requestAnimationFrame(() => this.render());
    }

    setEvents(){
        $(window).on("mousedown", e => {
            if(!this.selectedTool || e.which !== 1) return;
            e.preventDefault();
            this.selectedTool.onmousedown && this.selectedTool.onmousedown(e);
        });
        $(window).on("mousemove", e => {
            if(!this.selectedTool || e.which !== 1) return;
            e.preventDefault();
            this.selectedTool.onmousemove && this.selectedTool.onmousemove(e);
        });
        $(window).on("mouseup", e => {
            if(!this.selectedTool || e.which !== 1) return;
            e.preventDefault();
            this.selectedTool.onmouseup && this.selectedTool.onmouseup(e);
        });
        $(window).on("click", e => {
            if(!this.selectedTool || e.which !== 1) return;
            e.preventDefault();
            this.selectedTool.click && this.selectedTool.click(e);
        });
        $(window).on("dblclick", e => {
            if(!this.selectedTool || e.which !== 1) return;
            e.preventDefault();
            this.selectedTool.ondblclick && this.selectedTool.ondblclick(e);
        });
        $(this.canvas).on("contextmenu", e => {
            if(!this.selectedTool) return;
            e.preventDefault();
            this.selectedTool.oncontextmenu && this.selectedTool.oncontextmenu(menus => this.app.makeContextMenu(e.pageX, e.pageY, menus));
        });
    }
}