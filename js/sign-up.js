class App {
    constructor(){
        this.$form = $("#sign-up");

        this.canSubmit = true;

        this.setEvents();
    }

    checkError($target, condition, message){
        let $error = $target.siblings(".error");
        
        if(!condition) {
            $error.text(message);
            this.canSubmit = false;
            return;
        }

        $error.text('');
    }

    checkErrorAll($target, conditions, messages){
        let $error = $target.siblings(".error");
        for(let i in conditions){
            let cond = conditions[i];
            let msg = messages[i];
            if(!cond){
                $error.text(msg);
                this.canSubmit = false;
                return;
            }
        }

        $error.text('');
    }

    setEvents(){
        this.$form.on("submit", e => {
            e.preventDefault();

            this.canSubmit = true;

            this.checkError(
                $("#user_email"), 
                /^[0-9a-zA-Z]+@[0-9a-zA-Z]+\.[a-zA-Z]{2,3}$/.test($("#user_email").val()),
                "올바른 이메일을 입력하세요."
            );

            this.checkError(
                $("#password"), 
                /^(?=.*[a-z].*)(?=.*[A-Z].*)(?=.*[0-9].*)(?=.*[!@#$%^&*()].*)([a-zA-Z0-9!@#$%^&*()]{8,})$/.test($("#password").val()),
                "올바른 비밀번호을 입력하세요."
            );

            this.checkError(
                $("#passconf"), 
                $("#password").val() === $("#passconf").val(),
                "비밀번호와 비밀번호 확인이 불일치합니다."
            );

            let file = $("#image")[0].files.length > 0 ? $("#image")[0].files[0] : null;
            this.checkErrorAll(
                $("#image"), 
                [
                    file && ["jpg", "png", "gif"].includes(file.name.substr(-3).toLowerCase()),
                    file && file.size < 1024 * 1024 * 5
                ],
                [
                    "이미지 파일만 업로드 할 수 있습니다.",
                    "이미지 파일은 5MB 이상 업로드 할 수 없습니다."
                ]
            );
            
            this.checkError(
                $("#user_name"), 
                /^[ㄱ-ㅎㅏ-ㅣ가-힣]{2,4}$/.test($("#user_name").val()),
                "올바른 이름을 입력하세요."
            );

            if(this.canSubmit){
                alert("정상적으로 회원가입 되었습니다.");
            }

        });
    }
}

$(function(){
    let app = new App();
});