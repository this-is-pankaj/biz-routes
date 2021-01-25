module.exports = {
    port: process.env._Port,
    connectionString: process.env._ConnectionString,
    ewbConfig: {
        generateToken: {
            url: `http://testapi.taxprogsp.co.in/ewaybillapi/dec/v1.03/authenticate?action=ACCESSTOKEN`,
            headers: {
                aspid: process.env.aspId,
                password: process.env.aspPwd,
                gstin: '{{ewbGstin}}',
                username: '{{username}}',
                ewbpwd: '{{ewbPwd}}'
            }
        }
    }
}