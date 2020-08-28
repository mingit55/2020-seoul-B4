import Workspace from '/js/entry/Workspace.js';

class App {
    constructor(){
        this.texts = [
            `선택 도구는 가장 기본적인 도구로써, 작업 영역 내의 한지를 선택할 수 있게 합니다. 마우스 클릭으로 한지를 활성화하여 이동시킬 수 있으며, 선택된 한지는 삭제 버튼으로 삭제시킬 수 있습니다.`,
            `회전 도구는 작업 영역 내의 한지를 회전할 수 있는 도구입니다. 마우스 더블 클릭으로 회전하고자 하는 한지를 선택하면, 좌우로 마우스를 끌어당겨 회전시킬 수 있습니다. 회전한 뒤에는 우 클릭의 콘텍스트 메뉴로 '확인'을 눌러 한지의 회전 상태를 작업 영역에 반영할 수 있습니다.`,
            `자르기 도구는 작업 영역 내의 한지를 자를 수 있는 도구입니다. 마우스 더블 클릭으로 자르고자 하는 한지를 선택하면 마우스를 움직임으로써 자르고자 하는 궤적을 그릴 수 있습니다. 궤적을 그린 뒤에는 우 클릭의 콘텍스트 메뉴로 '자르기'를 눌러 그려진 궤적에 따라 한지를 자를 수 있습니다.`,
            `붙이기 도구는 작업 영역 내의 한지들을 붙일 수 있는 도구입니다. 마우스 더블 클릭으로 붙이고자 하는 한지를 선택하면 처음 선택한 한지와 근접한 한지들을 선택할 수 있습니다. 붙일 한지를 모두 선택한 뒤에는 우 클릭의 콘텍스트 메뉴로 '붙이기'를 눌러 선택한 한지를 붙일 수 있습니다.`
        ];
        this.searchList = [];
        this.focusIdx = null;

        new IDB("seoul", ["papers", "inventory"], async db => {
            this.db = db;
            this.ws = new Workspace(this);
            
            this.setEvents();
            
            let craftworks = await (fetch("/json/craftworks.json").then(res => res.json()));
            let tags = craftworks.reduce((p, c) => [...p, ...c.hash_tags], []).map(tag => tag.substr(1));
            this.entryModule = new HashModule("#hash_tags", tags)
        });
        
    }

    get focusItem(){
        return this.searchList[this.focusIdx];
    }

    makeContextMenu(x, y, menus){
        let $menus = $(`<div class="context-menu" style="left: ${x}px; top: ${y}px;"></div>`);
        
        menus.forEach(({name, onclick}) => {
            let $menu = $(`<div class="context-menu__item">${name}</div>`);
            $menu.on("mousedown", onclick);
            $menus.append($menu);
        });
     
        $(document.body).append($menus);
    }

    setEvents(){
        // 컨텍스트 메뉴 삭제
        $(window).on("mousedown", e => {
            $(".context-menu").remove();
        });
        
        // 도구 선택
        $(".tool .tool__item--tool").on("click", e => {
            let type = e.currentTarget.dataset.type;

            $(".tool .tool__item").removeClass("active");
            if(this.ws.selectedTool){
                this.ws.selectedTool.cancel && this.ws.selectedTool.cancel();
                this.ws.selectedTool.unselectAll();
            }

            if(this.ws.selectedName === type){
                this.ws.selectedName = null;
            } else {
                this.ws.selectedName = type;
                $(e.currentTarget).addClass("active");
            } 
        });

        // 한지 추가
        $("[data-target='#list-modal']").on("click", async e => {
            let papers = await this.db.getAll("inventory");
            
            $("#list-modal .row").html("");
            papers.forEach(paper => {
                $("#list-modal .row").append(`<div class="col-lg-4">
                                                <div class="list__item bg-white border" data-id="${paper.id}">
                                                    <img src="${paper.image}" alt="한지 이미지" class="fit-cover hx-200">
                                                    <div class="p-3">
                                                        <div class="fx-2">${paper.paper_name}</div>
                                                        <div class="mt-3">
                                                            <span class="fx-n2 text-muted">사이즈</span>
                                                            <span class="fx-1 ml-2">${paper.width_size}x × ${paper.height_size}px</span>
                                                        </div>
                                                        <div class="mt-2">
                                                            <span class="fx-n2 text-muted">소지 수량</span>
                                                            <span class="fx-1 ml-2">${paper.count}개</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>`);
            });
        });
        $("#list-modal").on("click", ".list__item", async e => {
            let id = parseInt(e.currentTarget.dataset.id);
            let paper = await this.db.get("inventory", id);
            
            this.ws.pushPaper(paper);
            
            if(--paper.count == 0){
                this.db.delete("inventory", paper.id);
            } else {
                this.db.put("inventory", paper);
            }

            $("#list-modal").modal("hide");
        });


        // 도움말 영역
        $(".tab__search input").on("keydown", e => {
            console.log(e.keyCode);
            if(e.keyCode === 13)
                this.searchTab();
        });
        $(".tab__search .icon-search").on("click", this.searchTab);

        $(".tab__search .icon-left").on("click", e => {
            this.focusItem.classList.remove("active");
            this.focusIdx = this.focusIdx - 1 < 0 ? this.searchList.length - 1 : this.focusIdx - 1;
            this.focusItem.classList.add("active");
            $(".tab__search > p").text(`${this.searchList.length}개 중 ${this.focusIdx + 1}번째`);


            let type = this.focusItem.parentElement.dataset.type;
            $("[name='tabs']").removeAttr("checked");
            $("#tab-" + type).attr("checked", true);
        });
        $(".tab__search .icon-right").on("click", e => {
            this.focusItem.classList.remove("active");
            this.focusIdx = this.focusIdx + 1 > this.searchList.length - 1 ? 0 : this.focusIdx + 1;
            this.focusItem.classList.add("active");
            $(".tab__search > p").text(`${this.searchList.length}개 중 ${this.focusIdx + 1}번째`);

            let type = this.focusItem.parentElement.dataset.type;
            $("[name='tabs']").removeAttr("checked");
            $("#tab-" + type).attr("checked", true);
        });
    }

    searchTab = () => {
        let keyword = $(".tab__search > input").val()
            .replace(/[.+*?^$\(\)\[\]\\\\\\/]/, "");

        let regex = new RegExp(`${keyword}`, "g");
        
        this.texts.forEach((text, i) => {
            let replaced = text.replace(regex, m1 => `<span>${m1}</span>`);
            $(".tab__content > .tab").eq(i).html(replaced);
        });
        
        this.focusIdx = 0;
        this.searchList = Array.from($(".tab__content span"));

        if(this.searchList.length > 0){
            this.searchList[0].classList.add("active");
            $(".tab__search > p").text(`${this.searchList.length}개 중 1번째`);
    
            let type = this.focusItem.parentElement.dataset.type;
            $("[name='tabs']").removeAttr("checked");
            $("#tab-" + type).attr("checked", true);
        } else {
            $(".tab__search > p").text(`일치하는 내용이 없습니다.`);
        }

    }
}

$(function(){
    let app = new App();
});