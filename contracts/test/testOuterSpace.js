const {assert, should, expect} = require("local-chai");
const {ethers, getNamedAccounts, deployments} = require("@nomiclabs/buidler");

describe("OuterSpace", function () {
  it("should work", async function () {
    await deployments.fixture();
    const outerSpaceContract = await ethers.getContract("OuterSpace");
    expect(true).to.be.a("boolean");
    expect(outerSpaceContract.address).to.be.a("string");
  });
});
