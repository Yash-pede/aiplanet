import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import NewWrokflow from "@/components/NewWrokflow";

const Page = () => {
  return (
    <div className="flex flex-col w-full justify-center items-center gap-40">
      <div className="flex flex-col md:flex-row justify-between md:items-center w-full">
        <p>My workflows</p>
        <NewWrokflow />
      </div>
      <Card className="md:w-96 w-full">
        <CardHeader>
          <CardTitle>Create new workflow</CardTitle>
          <CardDescription>
            Start building your generative Al apps with our essential tools and
            frameworks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewWrokflow />
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
