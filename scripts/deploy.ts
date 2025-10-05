import hardhat from 'hardhat';

async function main() {
  const [deployer] = await hardhat.ethers.getSigners();
  console.log('Deploying with:', deployer.address);

  const factory = await hardhat.ethers.getContractFactory('HashStore');
  const contract = await factory.deploy(deployer.address);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log('HashStore deployed at:', address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


