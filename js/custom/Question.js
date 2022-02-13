import Mask from "./Mask.js";
import {TipsDialog} from "./Dialog2.js";

class Question extends Mask {

    static allQuestions = []

    constructor(len = 5) {
        super()
        this.len = len
        Question.#loadQuestion('../../data/question.json', () => {
            this.questions = Question.#generateQuestion(this.len)
            this.questionStatus = []
            this.#renderBaseContainer()
            this.#renderQuestion(this.questions[this.questionStatus.length])
        })
    }

    /**
     * 加载 json 中的题目
     * @param url 路径
     * @param callback 加载完成后的回调
     */
    static #loadQuestion(url, callback) {
        fetch(url).then(response => {
            response.json().then(res => {
                Question.allQuestions = res.questions
                callback && callback()
            })
        })
    }

    /**
     * 随机生成道题目
     * @param length 道数
     */
    static #generateQuestion(length) {
        let len = length || 10
        len = Math.min(len, Question.allQuestions.length)

        let arr = []
        while (arr.length < len) {
            let question = Question.allQuestions[Math.floor(Math.random() * (Question.allQuestions.length - 1))]
            if (arr.some(item => question.id === item.id))
                continue
            arr.push(question)
        }

        return arr
    }

    /**
     * 渲染基础页面
     */
    #renderBaseContainer() {
        super.renderBaseContainer()
        this.questionContainer = document.createElement('div')
        this.questionContainer.className = 'question-container'
        this.baseContainerDiv = document.createElement('div')
        this.questionContainer.appendChild(this.baseContainerDiv)
        this.baseContainerDiv.innerHTML += `<div class="title_wrap"><h1 class="title">题目测试</h1><p>答对3道题目可以复活</p></div>`
        this.progressStr = document.createElement('div')
        this.progressStr.className = 'progress'
        this.baseContainerDiv.appendChild(this.progressStr)
        this.baseContainer.appendChild(this.questionContainer)
    }

    /**
     * 渲染题目
     * @param question
     */
    #renderQuestion(question) {
        let dom = this.questionContainer.querySelector('.question')
        dom && dom.remove()

        this.progressStr.innerText = this.questionStatus.length + 1 + '/' + this.len

        let questionDiv = document.createElement('div')
        questionDiv.className = 'question'
        questionDiv.innerHTML = `<h2 class="question-title">${question.title}</h2>`

        let optionsWrap = document.createElement('div')
        optionsWrap.className = 'options-wrap'
        for (let i = 0; i < question.options.length; i++) {
            let option = document.createElement('div')
            option.className = 'option'
            option.innerHTML = `<span>${question.options[i]}</span>`
            option.onclick = () => {

                optionsWrap.querySelectorAll('.option').forEach(item => {
                    item.classList.remove('active')
                })
                option.classList.add('active')
                button.classList.remove('disabled')
            }
            optionsWrap.appendChild(option)
        }

        questionDiv.appendChild(optionsWrap)
        this.baseContainerDiv.appendChild(questionDiv)

        let button = document.createElement('button')
        button.className = 'disabled'
        button.innerText = this.questionStatus.length === this.len - 1 ? '提交' : ' 下一题'

        button.onclick = () => {
            if (button.classList.contains('disabled')) {
                return
            }
            optionsWrap.querySelectorAll('div').forEach((item, index) => {
                if (item.classList.contains('active')) {
                    this.#next(index === question.answer)
                }
            })
        }

        questionDiv.appendChild(button)
    }

    /**
     * 下一题
     * @param isTrue
     */
    #next(isTrue) {
        this.questionStatus.push(isTrue)
        if (this.questionStatus.length < this.len) {
            this.#renderQuestion(this.questions[this.questionStatus.length])
        } else {
            this.status = 1
            let trueNum = this.questionStatus.filter(item => item).length
            new TipsDialog([{text: '确定', isClose: true}], () => {
                this.success = trueNum / this.len >= .6
                this.close()
            }).open(`共答对${trueNum}题`)
        }
    }

}

export default Question
