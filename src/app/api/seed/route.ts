import { country, countryToCuisine, cuisine, diet, dishType, nutrition } from "@/db/schema/recipe";
import { db } from "@/db";
import { NextResponse } from "next/server";

export async function POST() {
  const [{ id: philippinesId }] = await db.insert(country).values({
    name: "Philippines",
    icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/philippines-flag.png`,
    iconSource: "https://vectorflags.com/philippines/ph-circle-01"
  }).returning({
    id: country.id
  });

  const [{ id: filipinoCuisineId }] = await db.insert(cuisine).values({
    adjective: "Filipino",
    description: "Filipino cuisine is a vibrant and diverse culinary tradition that reflects the rich tapestry of Philippine history and culture. From savory stews to tropical desserts, Filipino dishes are known for their bold flavors, unique ingredients, and colorful presentation."
  }).returning({
    id: cuisine.id
  });
  
  const [{ id: usaId }] = await db.insert(country).values({
    name: "United States of America",
    icon: `${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL}/usa-flag.png`,
    iconSource: "https://vectorflags.com/united-states/us-circle-01"
  }).returning({
    id: country.id
  });

  const [{ id: americanCuisineId }] = await db.insert(cuisine).values({
    adjective: "American",
    description: "The U.S. is a melting pot of cultures as a result of the many people that came here from various other countries across the globe. A significant part of this equation, too, comes from the cultures of Indigenous peoples who lived on the land well before colonization. With this bountiful combination of culinary traditions, American cuisine has become greater than the sum of its parts and offers something unique. The nation has established several dishes that many consider examples of an American food tradition."
  }).returning({
    id: cuisine.id
  });

  await db.insert(countryToCuisine).values([
    {
      countryId: philippinesId,
      cuisineId: filipinoCuisineId
    },
    {
      countryId: usaId,
      cuisineId: americanCuisineId
    }
  ]);
  
  await db.insert(nutrition).values([
    {
      name: "Calories",
      description: "A unit of energy present in all foods.",
      allowedUnits: ["kcal"],
      isMacro: true
    },
    {
      name: "Fat",
      description: "A macronutrient primarily stored for long-term energy.",
      allowedUnits: ["g"],
      isMacro: true
    },
    {
      name: "Carbohydrates",
      description: "A form of energy that provides a short-term boost of energy and increases blood sugar levels.",
      allowedUnits: ["g"],
      isMacro: true
    },
    {
      name: "Protein",
      description: "A macronutrient that helps maintain cellular functions.",
      allowedUnits: ["g"],
      isMacro: true
    },
    {
      name: "Iron",
      description: "A micronutrient vital for motor function and organ development.",
      allowedUnits: ["μg", "mg"]
    },
    {
      name: "Vitamin A",
      description: "A nutrient that optimizes quality of vision and immune system functions.",
      allowedUnits: ["μg"]
    },
    {
      name: "Vitamin D",
      description: "A nutrient that boosts immune system health. This nutrient is also created by the body in exposure to sunlight.",
      allowedUnits: ["μg"]
    },
    {
      name: "Sodium",
      description: "A mineral that serves",
      allowedUnits: ["mg"]
    }
  ]);

  await db.insert(diet).values([
    {
      name: "Paleo",
      description: "A completely natural way of eating, but seriously lacks any source of sugar. Therefore, the body will start using fat as the main energy source."
    },
    {
      name: "Vegetarian",
      description: "A diet that places an emphasis on eating plant-based foods such as fruits, vegetables, seeds, and nuts."
    },
    {
      name: "Vegan",
      description: "A subtype of the vegetarian diet that completely eliminates any animal products such as dairy and meat. This drastically decreases intake of cholesterol and fat."
    },
    {
      name: "Mediterranean",
      description: "A diet primarily of vegetables with a slightly higher emphasis on meat compared to the traditional vegetable diet."
    },
    {
      name: "Kosher",
      description: "A diet that is deemed permissible in the eyes of Judaism."
    },
    {
      name: "Halal",
      description: "A rule that dictates that foods are allowed to be eaten under the dietary laws of Islam."
    },
    {
      name: "Ketogenic",
      description: "A diet that maximizes fat but minimizes carbohydate consumption. It is usually recommended as medical treatment for various diseases."
    },
    {
      name: "South Beach",
      description: "A weight-loss diet that limits the intake of carbohydrates to minimize signs of weight gain."
    }
  ]);

  await db.insert(dishType).values([
    {
      name: "Main Course",
      description: "The primary dish that is the highlight of a meal. It is usually the most presentable and appetizing dish."
    },
    {
      name: "Side",
      description: "A dish that complements the main course of a meal. They are known to add an extra variety to flavor."
    },
    {
      name: "Condiment",
      description: "A substance or sauce that intensifies the flavor of any dish that is combined with it. They are essential for maximizing the flavor of any dish."
    },
    {
      name: "Appetizer",
      description: "A food or drink is served before the main course to stimulate the appetite."
    },
    {
      name: "Breakfast",
      description: "The first meal eaten in the day. This is typically served during the morning."
    },
    {
      name: "Lunch",
      description: "A meal consumed around the middle of the day, usually around noon."
    },
    {
      name: "Dinner",
      description: "A meal eaten at around the evening time. This is considered the most formal and biggest meal of the day."
    },
    {
      name: "Snack",
      description: "A small portion of food that is usually eaten between meals. This is usually treated as an energy recharge method."
    },
    {
      name: "Drink",
      description: "A liquid intended for consumption. It is usually consumed after drinking a meal or a snack."
    },
    {
      name: "Alcohol",
      description: "An active ingredient that is considered a depressant to the central nervous system. Make sure to consume in moderation!"
    },
    {
      name: "Dessert",
      description: "A course that is eaten after a meal. Most are made to be sweet delicacies."
    },
    {
      name: "Meat",
      description: "Muscle tissue that is usually cooked to perfection to suit the best states. Vegans beware!"
    },
    {
      name: "Dairy",
      description: "Food that contains any traces of milk. "
    },
    {
      name: "Vegetable",
      description: "Edible plants that are safe for consumption. Serving options such as raw or cooked are commonly used."
    },
    {
      name: "Fruit",
      description: "Products of fruit-bearing plants that are geared towards human and animal consumption. It is usually consumed on its own."
    }
  ]);

  return NextResponse.json({ message: "Insert successful!" });
}