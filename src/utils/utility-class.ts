class ErrorHandler extends Error{
    constructor(public message :string,public statusCode:number){
        super();
        this.statusCode=statusCode;
    }
}

export default ErrorHandler;












